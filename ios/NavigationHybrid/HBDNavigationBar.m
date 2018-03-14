//
//  HBDNavigationBar.m
//  NavigationHybrid
//
//  Created by Listen on 2018/3/6.
//  Copyright © 2018年 Listen. All rights reserved.
//

#import "HBDNavigationBar.h"
#import "HBDTitleView.h"
#import "HBDUtils.h"

@interface HBDNavigationBar()

@property (nonatomic, strong, readwrite) UIView *alphaView;

@property (nonatomic, strong, readwrite) UIImageView *shadowImageView;

@end

@implementation HBDNavigationBar

- (instancetype)initWithFrame:(CGRect)frame {
    if (self = [super initWithFrame:frame]) {
        _shadowAlpha = 1.0;
    }
    return self;
}

- (instancetype)initWithCoder:(NSCoder *)aDecoder {
    if (self = [super initWithCoder:aDecoder]) {
        _shadowAlpha = 1.0;
    }
    return self;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event {
    if (!self.isUserInteractionEnabled || self.isHidden || self.alpha <= 0.01) {
        return nil;
    }
    UIView *view = [super hitTest:point withEvent:event];

    NSString *viewName = [[[view classForCoder] description] stringByReplacingOccurrencesOfString:@"_" withString:@""];
    if ([viewName isEqualToString:@"HBDNavigationBar"]) {
        for (UIView *subview in self.subviews) {
            NSString *viewName = [[[subview classForCoder] description] stringByReplacingOccurrencesOfString:@"_" withString:@""];
            NSArray *array = @[ @"UINavigationItemButtonView" ];
            if ([array containsObject:viewName]) {
                CGPoint convertedPoint = [self convertPoint:point toView:subview];
                if (CGRectContainsPoint(subview.bounds, convertedPoint)) {
                    return view;
                }
            }
        }
    }
    
    NSArray *array = @[ @"UINavigationBarContentView", @"HBDNavigationBar" ];
    if ([array containsObject:viewName]) {
        if (self.alphaView.alpha < 0.01) {
            return nil;
        }
    }
    
    return view;
}

- (void)layoutSubviews {
    [super layoutSubviews];
    self.shadowImageView.alpha = self.shadowAlpha;
}

- (void)setShadowAlpha:(float)shadowAlpha {
    _shadowAlpha = shadowAlpha;
    self.shadowImageView.alpha = shadowAlpha;
}

- (UIImageView *)shadowImageView {
    if (_shadowImageView) {
        return _shadowImageView;
    }
    _shadowImageView = [HBDUtils findShadowImageAt:self];
    return _shadowImageView;
}

- (UIView *)alphaView {
    if (_alphaView) {
        return _alphaView;
    }

    id backgroundView = self.subviews[0];
    UIView *alphaView;
    if ([self isTranslucent]) {
        if (@available(iOS 10.0, *)) {
            UIImage *backgroundImage = [self backgroundImageForBarMetrics:UIBarMetricsDefault];
            if (!backgroundImage) {
                alphaView = [backgroundView valueForKey:@"_backgroundEffectView"];
            }
        } else {
            UIView *adaptiveBackdrop = [backgroundView valueForKey:@"_adaptiveBackdrop"];
            alphaView = adaptiveBackdrop;
        }
    }
    
    if (!alphaView) {
        alphaView = backgroundView;
    }
    
    _alphaView = alphaView;
    return alphaView;
}

@end