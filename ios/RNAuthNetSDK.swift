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
  
  var deviceID: String? = nil
  var anet: AuthNet? = nil
  
  var loginPromise: Promise? = nil

  func isInit() -> Bool {
    if anet != nil {
      return true
    }
    return false
  }

  func doReject(_ cb: RCTPromiseRejectBlock, _ name: String, _ msg: String) {
    let err = NSError(domain: name, code: 1)
    print("Rejecting with error: \(name): \(msg)")
    cb(err.domain, msg, err)
  }

  @objc(mobileDeviceLoginSucceeded:)
  func mobileDeviceLoginSucceeded(_ res: MobileDeviceLoginResponse) {
    guard let p = loginPromise else {
      print("@mobileDeviceLoginSucceeded: Error! Nothing stored in loginPromise!")
      return
    }
    
    print("Login response")
    if res.errorType != NO_ERROR {
      doReject(p.reject, String(describing: res.errorType), "@mobileDeviceLoginSucceeded: Got an error from Authorize!")
      return
    }
    
    print("Successfully captured session token")
    anet?.sessionToken = res.sessionToken
    
    p.resolve(true)
    loginPromise = nil
  }

  @objc(initAuthNet:devID:user:pass:resolve:reject:)
  func initAuthNet(env: String, devID: String, user: String, pass: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {

    if loginPromise != nil {
      doReject(reject, "login_in_progress", "Another login attempt is already in progress!")
      return
    }
    if isInit() {
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
    anet = AuthNet(environment: lEnv == "live" ? ENV_LIVE : ENV_TEST)
    anet?.delegate = self

    deviceID = devID
    
    print("Attempting mobile login")
    loginPromise = Promise(resolve, reject)
    let loginReq = MobileDeviceLoginRequest()
    loginReq.anetApiRequest.merchantAuthentication.name = user
    loginReq.anetApiRequest.merchantAuthentication.password = pass
    loginReq.anetApiRequest.merchantAuthentication.mobileDeviceId = deviceID
    anet?.mobileDeviceLoginRequest(loginReq)
    // Execution should then hit mobileDeviceLoginSucceeded
  }
  
  @objc(chargeIt:reject:)
  func chargeIt(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    if !isInit() {
      doReject(reject, "anet_not_init", "Not logged in to Authorize merchant interface!")
      return
    }
    
    print("Trying to charge it")
    
    let cc = CreditCardType()
    cc.cardNumber = "4111111111111111"
    cc.expirationDate = "1120"
    cc.cardCode = "123"
    let payment = PaymentType()
    payment.creditCard = cc
    
    let txn = TransactionRequestType()
    txn.amount = "1.0"
    txn.payment = payment
    let txnReq = CreateTransactionRequest()
    txnReq.transactionType = AUTH_CAPTURE
    txnReq.transactionRequest = txn

    anet?.purchase(with: txnReq)

    resolve(true)
  }
  

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
