//
//  RNAuthNetSDK.swift
//  Tada
//

class Promise {
  let resolve: RCTPromiseResolveBlock
  let reject: RCTPromiseRejectBlock
  
  init(_ res: @escaping RCTPromiseResolveBlock, _ rej: @escaping RCTPromiseRejectBlock){
    self.resolve = res
    self.reject = rej
  }
}

@objc(RNAuthNetSDK)
class RNAuthNetSDK: NSObject, AuthNetDelegate {
  
  // --- Instance variables ---
  
  var deviceID: String? = nil
  var anetInstance: AuthNet? = nil
  var sessionToken: String? = nil
  
  var loginPromise: Promise? = nil
  var txnPromise: Promise? = nil
  
  // --- Convenience methods ---
  
  func doReject(_ cb: RCTPromiseRejectBlock, _ name: String, _ msg: String) {
    let err = NSError(domain: name, code: 1)
    print("Rejecting with error: \(name): \(msg)")
    cb(err.domain, msg, err)
  }
  
  // --- AuthNetDelegate callbacks ---
  
  func mobileDeviceLoginSucceeded(_ res: MobileDeviceLoginResponse!) {
    print("Hit @mobileDeviceLoginSucceeded")
    guard let p = loginPromise else {
      print("@mobileDeviceLoginSucceeded: Error! Nothing stored in loginPromise!")
      return
    }
    
    print("Login response")
    if res.errorType != NO_ERROR {
      let messages = res.anetApiResponse.messages.messageArray ?? ["Nope, can't find them"]
      doReject(p.reject, String(describing: res.errorType), "@mobileDeviceLoginSucceeded: Got an error from Authorize! \(messages)")
      return
    }
    
    print("Successfully captured session token")
    sessionToken = res.sessionToken
    
    p.resolve(true)
    loginPromise = nil
  }
  
  func paymentSucceeded(_ res: CreateTransactionResponse!) {
    print("Hit @paymentSucceeded")
    guard let p = txnPromise else {
      print("@paymentSucceeded: Error! Nothing stored in txnPromise!")
      return
    }
    
    print("Txn response")
    if res.errorType != NO_ERROR {
      let messages = res.anetApiResponse.messages.messageArray ?? ["Nope, can't find them"]
      doReject(p.reject, String(describing: res.errorType), "@paymentSucceeded: Got an error from Authorize! \(messages)")
      return
    }
    
    print("Charge OK")
    let txnId = res.transactionResponse.transId
    p.resolve(txnId)
    txnPromise = nil
  }
  
  func requestFailed(_ res: AuthNetResponse!) {
    print("Hit @requestFailed!")
    guard let p = txnPromise else {
      print("@paymentSucceeded: Error! Nothing stored in txnPromise!")
      return
    }
    
    let messages = res.anetApiResponse.messages.messageArray ?? ["Nope, can't find them"]
    doReject(p.reject, String(describing: res.errorType), "@paymentSucceeded: Got an error from Authorize! \(messages)")
    return
  }
  
  // --- React-exposed methods ---
  
  @objc(initAuthNet:devID:user:pass:resolve:reject:)
  func initAuthNet(env: String, devID: String, user: String, pass: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    
    if loginPromise != nil {
      doReject(reject, "login_in_progress", "Another login attempt is already in progress!")
      return
    }
    if anetInstance != nil {
      doReject(reject, "anet_already_init", "Authorize merchant interface already initialized!")
      return
    }
    
    let lEnv = env.lowercased()
    if !(lEnv == "live" || lEnv == "test") {
      print("Provided envrionment was neither 'test' nor 'live'.")
      doReject(reject, "bad_env", "Provided envrionment was neither 'test' nor 'live'.")
      return
    }
    
    print("Received envrionment: \(lEnv)")
    anetInstance = AuthNet(environment: lEnv == "live" ? ENV_LIVE : ENV_TEST)
    guard let anet = anetInstance else {
      doReject(reject, "anet_init_fail", "Failed to initialize Authorize.Net client")
      return
    }
    anet.delegate = self
    
    deviceID = devID
    
    print("Attempting mobile login")
    let loginReq = MobileDeviceLoginRequest()
    loginReq.anetApiRequest.merchantAuthentication.name = user
    loginReq.anetApiRequest.merchantAuthentication.password = pass
    loginReq.anetApiRequest.merchantAuthentication.mobileDeviceId = deviceID
    
    loginPromise = Promise(resolve, reject)
    anet.mobileDeviceLoginRequest(loginReq)
    // Execution should then hit mobileDeviceLoginSucceeded
  }
  
  @objc(chargeIt:reject:)
  func chargeIt(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    guard let anet = anetInstance else {
      doReject(reject, "anet_not_init", "Authorize merchant interface not initialized!")
      return
    }
    guard let token = sessionToken else {
      doReject(reject, "anet_not_logged_in", "Not logged in to Authorize merchant interface!")
      return
    }
    
    print("Trying to charge it")
    let explode = { (x: String) in
      print("AAAH explosions!! \(x)")
      self.doReject(reject, "anet_sdk_error", "This thing failed: \(x)")
    }
    
    guard let cc = CreditCardType.creditCardType() as? CreditCardType else {
      explode("cc type")
      return
    }
    cc.cardNumber = "4111111111111111"
    cc.expirationDate = "1120"
    cc.cardCode = "123"
    let payment = PaymentType()
    payment.creditCard = cc
    
    guard let txn = TransactionRequestType.transactionRequest() else {
      explode("txn request type")
      return
    }
    txn.amount = "1.0"
    txn.payment = payment
    let txnReq = CreateTransactionRequest()
    txnReq.transactionType = AUTH_CAPTURE
    txnReq.transactionRequest = txn
    txnReq.anetApiRequest.merchantAuthentication.mobileDeviceId = deviceID
    txnReq.anetApiRequest.merchantAuthentication.sessionToken = token
    
    txnPromise = Promise(resolve, reject)
    anet.purchase(with: txnReq)
    // Execution should then hit paymentSucceeded
  }
  
  // --- Config & other stuff that has to be here ---
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
