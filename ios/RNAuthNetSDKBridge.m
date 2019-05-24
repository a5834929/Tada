//
//  RNAuthNetSDKBridge.m
//  Tada
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNAuthNetSDK, NSObject)

RCT_EXTERN_METHOD(initAuthNet:(NSString *)env devID:(NSString *)devID user:(NSString *)user pass:(NSString *)pass resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject);

RCT_EXTERN_METHOD(chargeIt:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject);

RCT_EXTERN_METHOD(swipeIt:(NSString *)blob amount:(NSString *)amount resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject);

@end
