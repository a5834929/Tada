//
//  RNAuthNetSDK.swift
//  Tada
//

@objc(RNAuthNetSDK)
class RNAuthNetSDK: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc(initAuthNet:devID:user:pass:resolver:rejecter:)
  func initAuthNet(env: String, devID: String, user: String, pass: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    print("Hello world, using env:")
    print(env)
    resolve(true)
  }
  
}
