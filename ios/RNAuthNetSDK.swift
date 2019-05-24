//
//  RNAuthNetSDK.swift
//  Tada
//

// Convenience class for Promise rejecting & resolving
class Promise {
  let resolve: RCTPromiseResolveBlock
  let reject: RCTPromiseRejectBlock
  
  init(_ res: @escaping RCTPromiseResolveBlock, _ rej: @escaping RCTPromiseRejectBlock){
    self.resolve = res
    self.reject = rej
  }
}

// Main SDK/NativeModule class
@objc(RNAuthNetSDK)
class RNAuthNetSDK: NSObject, AuthNetDelegate {
  
  // --- Stored properties --- //

  var deviceID: String? = nil
  var anet: AuthNet? = nil
  var sessionToken: String? = nil
  
  var loginPromise: Promise? = nil
  var txnPromise: Promise? = nil
  
  // --- Convenience functions --- //
  
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

  // --- AuthNetDelegate functions --- //
  
  @objc(mobileDeviceLoginSucceeded:)
  func mobileDeviceLoginSucceeded(_ res: MobileDeviceLoginResponse) {
    guard let p = loginPromise else {
      print("@mobileDeviceLoginSucceeded: Error! Nothing stored in loginPromise!")
      return
    }
    
    let reason = res.responseReasonText ?? ""
    let messages = res.anetApiResponse.messages.messageArray ?? ["Nope, can't find them"]
    
    print("Login response: \(reason) - \(messages)")
    if res.errorType != NO_ERROR {
      doReject(p.reject, String(describing: res.errorType), "@mobileDeviceLoginSucceeded: Got an error from Authorize! \(reason) - \(messages)")
      return
    }
    
    print("Successfully captured session token")
    anet?.sessionToken = res.sessionToken
    self.sessionToken = res.sessionToken
    
    p.resolve(true)
    loginPromise = nil
  }

  func paymentSucceeded(_ res: CreateTransactionResponse!) {
    print("Hit @paymentSucceeded")

    guard let p = txnPromise else {
      print("@paymentSucceeded: Error! Nothing stored in txnResult!")
      return
    }
    
    let reason = res.responseReasonText ?? ""
    let messages = res.anetApiResponse.messages.messageArray ?? ["Nope, can't find them"]
    print("Txn API response: \(reason) - \(messages)")
    if res.errorType != NO_ERROR {
      doReject(p.reject, String(describing: res.errorType), "@paymentSucceeded: Got an error from Authorize! \(reason) \(messages)")
      return
    }

    print("Charge OK")
    p.resolve(res.transactionResponse.transId)
    txnPromise = nil
  }
  
  func requestFailed(_ res: AuthNetResponse!) {
    print("Hit @requestFailed!")
    
    let reason = res.responseReasonText ?? ""
    let messages = res.anetApiResponse.messages.messageArray ?? ["Nope, can't find them"]
    let errString = "@requestFailed: Got an error '\(String(describing: res.errorType))' from Authorize! \(reason) - \(messages)"
    print(errString)
    
    if let p = loginPromise {
      doReject(p.reject, String(describing: res.errorType), errString)
      loginPromise = nil
    }
    if let p = txnPromise {
      doReject(p.reject, String(describing: res.errorType), errString)
      txnPromise = nil
    }
  }

  // --- React Native exposed functions --- //

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
    txnReq.anetApiRequest.merchantAuthentication.mobileDeviceId = self.deviceID
    txnReq.anetApiRequest.merchantAuthentication.sessionToken = self.sessionToken
    
    anet?.purchase(with: txnReq)
    txnPromise = Promise(resolve, reject)
    // Logic should pick up at paymentSucceeded
  }
  
  @objc(swipeIt:amount:resolve:reject:)
  func swipeIt(blob: String, amount: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    if !isInit() {
      doReject(reject, "anet_not_init", "Not logged in to Authorize merchant interface!")
      return
    }
    
    print("Trying to charge it")
    
    let swiperData = SwiperDataType()
    swiperData.encryptedValue = blob
    swiperData.deviceDescription = "4649443D4944544543482E556E694D61672E416E64726F69642E53646B7631" //"FID=IDTECH.UniMag.Android.Sdkv1"
    swiperData.encryptionType = "TDES"

    let payment = PaymentType()
    payment.swiperData = swiperData
    payment.creditCard.cardNumber = nil;
    payment.creditCard.cardCode = nil;
    payment.creditCard.expirationDate = nil;
    
    let txn = TransactionRequestType()
    txn.amount = amount
    txn.payment = payment
    txn.retail = TransRetailInfoType()
    txn.retail.marketType = "2"
    txn.retail.deviceType = "7"
    
    let txnReq = CreateTransactionRequest()
    txnReq.transactionRequest = txn
    txnReq.transactionType = AUTH_CAPTURE
    txnReq.anetApiRequest.merchantAuthentication.mobileDeviceId = self.deviceID
    txnReq.anetApiRequest.merchantAuthentication.sessionToken = self.sessionToken
    
    anet?.purchase(with: txnReq)
    txnPromise = Promise(resolve, reject)
    // Logic should pick up at paymentSucceeded
  }

  // --- Other necessary stuff --- //

  @objc(requiresMainQueueSetup)
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
