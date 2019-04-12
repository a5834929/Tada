//
//  RNAuthNetSDK.m
//  Tada
//
//  Created by Jonathan Ming on 4/11/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "RNAuthNetSDK.h"
#import <React/RCTLog.h>

@implementation RNAuthNetSDK

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(addEvent:(NSString *)name location:(NSString *)location)
{
  RCTLogInfo(@"Pretending to create an event %@ at %@", name, location);
}

@end
