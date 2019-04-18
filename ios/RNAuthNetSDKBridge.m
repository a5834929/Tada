//
//  RNAuthNetSDKBridge.m
//  Tada
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNAuthNetSDK, NSObject)

RCT_EXTERN_METHOD(addEvent:(NSString *)name location:(NSString *)location)

@end
