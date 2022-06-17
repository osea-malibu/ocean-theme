var yotpoWidgetsContainer = yotpoWidgetsContainer || { guids: {} };
(function () {
  var guid = "DsuqaG0zlf2fAYBY85pxQw";
  var loader = {
    loadDep: function (link, onLoad, strategy) {
      var script = document.createElement("script");
      script.onload = onLoad || function () {};
      script.src = link;
      if (strategy === "defer") {
        script.defer = true;
      } else if (strategy === "async") {
        script.async = true;
      }
      script.setAttribute("type", "text/javascript");
      script.setAttribute("charset", "utf-8");
      document.head.appendChild(script);
    },
    config: {
      data: {
        guid: guid,
      },
      widgets: {
        22583: {
          instanceId: "22583",
          instanceVersionId: "1143382",
          templateAssetUrl:
            "https://cdn-widget-assets.yotpo.com/widget-referral-widget/app.v1.6.28-2677.js",
          cssOverrideAssetUrl:
            "https://cdn-widget-assets.yotpo.com/ReferralWidget/DsuqaG0zlf2fAYBY85pxQw/css-overrides/css-overrides.2020_09_21_12_57_54_926.css",
          customizationCssUrl: "",
          customizations: {
            "background-color": "rgba( 222, 206, 182, 1 )",
            "background-image-url":
              "https://cdn-widget-assets.yotpo.com/static_assets/DsuqaG0zlf2fAYBY85pxQw/images/image_2020_09_18_00_33_42_885",
            "customer-email-view-button-text": "NEXT",
            "customer-email-view-description":
              "Give your friends $20 off on their first order of $80+ and get $20 off your next order of $80+ for each successful referral",
            "customer-email-view-header": "",
            "customer-email-view-title": "Share the Love",
            "default-toggle": true,
            "description-color": "rgba( 0, 0, 0, 1 )",
            "description-font-size": "20px",
            "final-view-button-text": "REFER MORE FRIENDS",
            "final-view-description":
              "Remind your friends to check their emails.",
            "final-view-error-description":
              "We were unable to send the referral link. This may be because that email is already associated to an existing customer or the email was spelled incorrectly. ",
            "final-view-error-text": "GO BACK",
            "final-view-error-title": "SOMETHING WENT WRONG",
            "final-view-title": "THANKS FOR REFERRING",
            "fonts-primary-font-name-and-url":
              "Orpheus@400|https://cdn.shopify.com/s/files/1/1368/9993/files/OrpheusW05-Regular.woff2?v=1586153014",
            "fonts-secondary-font-name-and-url":
              "Source Sans Pro@300|https://fonts.googleapis.com/css?family=Source+Sans+Pro:300\u0026display=swap",
            "header-color": "rgba( 29, 77, 65, 1 )",
            "header-font-size": "18px",
            "main-share-option-desktop": "main_share_email",
            "main-share-option-mobile": "main_share_email",
            "next-button-background-color": "rgba( 249, 247, 244, 1 )",
            "next-button-font-size": "18px",
            "next-button-size": "large",
            "next-button-text-color": "rgba( 29, 77, 65, 1 )",
            "next-button-type": "filled_rectangle",
            "referral-history-completed-points-text": "{{points}} POINTS",
            "referral-history-completed-status-type": "text",
            "referral-history-confirmed-status": "COMPLETED",
            "referral-history-pending-status": "PENDING",
            "referral-history-points-reward": 0,
            "referral-history-redeem-text":
              "When your friend places a purchase through your unique referral link, you will receive a $20 coupon code via email. ",
            "referral-history-sumup-line-points-text": "{{points}} POINTS",
            "referral-history-sumup-line-text": "Your Rewards",
            "referral-views-button-text": "SHARE SAFE SKINCARE",
            "referral-views-copy-link-button-text": "COPY LINK",
            "referral-views-description":
              "Give your friends $20 off on their first order of $80+ and get $20 off your next order of $80+ for each successful referral",
            "referral-views-email-share-body":
              "How does a discount off your first order at {{company_name}} sound? Use the link below and once you've shopped, I'll get a reward too.\n{{referral_link}}",
            "referral-views-email-share-subject":
              "Discount to a Store You'll Love!",
            "referral-views-email-share-type": "marketing_email",
            "referral-views-header": "",
            "referral-views-personal-email-button-text": "SEND VIA MY EMAIL",
            "referral-views-sms-button-text": "SEND VIA SMS",
            "referral-views-title": "Share the Love",
            "referral-views-whatsapp-button-text": "SEND VIA WHATSAPP",
            "share-allow-copy-link": true,
            "share-allow-email": true,
            "share-allow-facebook": true,
            "share-allow-sms": true,
            "share-allow-twitter": true,
            "share-allow-whatsapp": "false",
            "share-facebook-description":
              "You’ll love {{company_name}} as much as I do",
            "share-facebook-header": "Earn A Discount When You Shop Today!",
            "share-facebook-image-url": "",
            "share-icons-color": "rgba( 29, 77, 65, 1 )",
            "share-settings-copyLink": true,
            "share-settings-default-checkbox": true,
            "share-settings-default-mobile-checkbox": true,
            "share-settings-email": true,
            "share-settings-facebook": true,
            "share-settings-fbMessenger": true,
            "share-settings-mobile-copyLink": true,
            "share-settings-mobile-email": true,
            "share-settings-mobile-facebook": true,
            "share-settings-mobile-fbMessenger": true,
            "share-settings-mobile-sms": true,
            "share-settings-mobile-twitter": true,
            "share-settings-mobile-whatsapp": true,
            "share-settings-twitter": true,
            "share-settings-whatsapp": true,
            "share-sms-message":
              "I love {{company_name}}! Shop through my link to get a reward {{referral_link}}",
            "share-twitter-message":
              "These guys are great! Get a discount using my link: ",
            "share-whatsapp-message":
              "I love {{company_name}}! Shop through my link to get a reward {{referral_link}}",
            "tab-size": "small",
            "tab-type": "lower_line",
            "tab-view-primary-tab-text": "REFER A FRIEND",
            "tab-view-secondary-tab-text": "YOUR REFERRALS",
            "tile-color": "rgba( 222, 206, 182, 1 )",
            "title-color": "rgba( 29, 77, 65, 1 )",
            "title-font-size": "48px",
            "view-exit-intent-enabled": false,
            "view-exit-intent-mobile-timeout-ms": 10000,
            "view-is-popup": false,
            "view-layout": "right",
            "view-popup-delay-ms": 0,
            "view-show-popup-on-exit": false,
            "view-show-referral-history": "false",
            "view-table-rectangular-dark-pending-color":
              "rgba( 255, 255, 255, 1 )",
            "view-table-rectangular-light-pending-color": "#FFFFFF",
            "view-table-selected-color": "#558342",
            "view-table-theme": "dark",
            "view-table-type": "rectangular",
            "wadmin-text-and-share-choose-sreen": "step_1",
          },
          staticContent: {
            companyName: "OSEA® Malibu",
            cssEditorEnabled: "true",
            currency: "USD",
            hasPrimaryFontsFeature: true,
            merchantId: "65908",
            migrateTabColorToBackground: true,
            platformName: "shopify",
            referralHistoryEnabled: true,
            referralHost: "http://rwrd.io",
          },
          className: "ReferralWidget",
          dependencyGroupId: 2,
        },

        8017: {
          instanceId: "8017",
          instanceVersionId: "1136267",
          templateAssetUrl:
            "https://cdn-widget-assets.yotpo.com/widget-products-redemption/app.v0.2.21-2729.js",
          cssOverrideAssetUrl: "",
          customizationCssUrl: "",
          customizations: {
            "apply-button-color": "#000000",
            "apply-button-font-size": "14",
            "apply-button-text": "Apply",
            "apply-button-text-color": "#ffffff",
            "apply-button-type": "rounded_filled_rectangle",
            "cancel-button-text-color": "#0f0c6d",
            "carousel-custom-arrows-icons": false,
            "confirm-button-color": "rgba( 29, 77, 65, 1 )",
            "confirm-button-text-color": "#ffffff",
            "confirm-button-type": "filled_rectangle",
            "confirmation-step-cancel-option": "CANCEL",
            "confirmation-step-confirm-option": "YES, ADD IT",
            "confirmation-step-title": "Add this item to your cart?",
            "cost-color": "rgba( 29, 77, 65, 1 )",
            "cost-font-size": "20",
            "cost-text-redemption": "{{points}} POINTS",
            "desktop-slides-per-view": 4,
            "dropdown-border-color": "#848ca3",
            "dropdown-border-radius": "2px",
            "dropdown-point-balance-color": "#011247",
            "dropdown-point-balance-number-color": "#011247",
            "dropdown-text": "Choose Product",
            "go-back-text": "GO BACK",
            "has-free-product-failure":
              "Oops! You can only redeem one free product per purchase.",
            "has-no-paid-product-failure":
              "Oops! Add at least one paid product to your cart in order to redeem.",
            headline: "REDEEM FOR PRODUCTS",
            "headline-color": "rgba( 29, 77, 65, 1 )",
            "headline-font-size": "36",
            "image-ratio": "square",
            "limit-one-free-product": "true",
            "login-button-color": "rgba( 29, 77, 65, 1 )",
            "login-button-text": "REDEEM NOW",
            "login-button-text-color": "rgba( 29, 77, 65, 1 )",
            "login-button-type": "rectangular_outline",
            "mobile-items-per-slide": 4,
            "must-have-paid-product": "true",
            "point-balance-text": "You have {{current_point_balance}} points",
            "points-balance-color": "rgba( 29, 77, 65, 1 )",
            "points-balance-font-size": 24,
            "points-balance-number-color": "rgba( 29, 77, 65, 1 )",
            "primary-font-name-and-url":
              "Orpheus@400|https://cdn.shopify.com/s/files/1/1368/9993/files/OrpheusW05-Regular.woff2?v=1586153014",
            "product-362889-displayname": "Travel Size Undaria Argan Oil",
            "product-362889-settings-background-border-color":
              "rgba( 0, 0, 0, 0 )",
            "product-362889-settings-background-fill-color": "#ffffff",
            "product-362889-settings-background-has-shadow": "true",
            "product-362889-settings-background-image-url":
              "https://cdn-swell-paperclip.yotpo.com/images/images/15905_1599664754.original.jpg?1599664754",
            "product-362889-settings-cancel-button-text-color": "#0f0c6d",
            "product-362889-settings-confirm-button-color":
              "rgba( 29, 77, 65, 1 )",
            "product-362889-settings-confirm-button-text-color": "#ffffff",
            "product-362889-settings-confirmation-step-cancel-option": "CANCEL",
            "product-362889-settings-confirmation-step-confirm-option":
              "YES, ADD IT",
            "product-362889-settings-cost": "100",
            "product-362889-settings-cost-color": "rgba( 29, 77, 65, 1 )",
            "product-362889-settings-cost-font-size": "20",
            "product-362889-settings-cost-text": "{{points}} POINTS",
            "product-362889-settings-hidden": "false",
            "product-362889-settings-out-of-stock": "false",
            "product-362889-settings-redeem-button-color":
              "rgba( 29, 77, 65, 1 )",
            "product-362889-settings-redeem-button-text": "REDEEM NOW",
            "product-362889-settings-redeem-button-text-color":
              "rgba( 29, 77, 65, 1 )",
            "product-362889-settings-redeem-button-type": "rectangular_outline",
            "product-362889-settings-restrict-specific-tier": "false",
            "product-362889-settings-reward": "Travel Size Undaria Argan Oil",
            "product-362889-settings-reward-color": "rgba( 29, 77, 65, 1 )",
            "product-362889-settings-reward-font-size": "18",
            "product-362889-settings-show-in-logged-out": "No",
            "product-362889-settings-variant-id": "32453696585802",
            "product-362890-displayname":
              "Travel Size Essential Corrective Complex",
            "product-362890-settings-background-border-color":
              "rgba( 0, 0, 0, 0 )",
            "product-362890-settings-background-fill-color": "#ffffff",
            "product-362890-settings-background-has-shadow": "true",
            "product-362890-settings-background-image-url":
              "https://cdn-swell-paperclip.yotpo.com/images/images/15904_1599664741.original.jpg?1599664741",
            "product-362890-settings-cancel-button-text-color": "#0f0c6d",
            "product-362890-settings-confirm-button-color":
              "rgba( 29, 77, 65, 1 )",
            "product-362890-settings-confirm-button-text-color": "#ffffff",
            "product-362890-settings-confirmation-step-cancel-option": "CANCEL",
            "product-362890-settings-confirmation-step-confirm-option":
              "YES, ADD IT",
            "product-362890-settings-cost": "100",
            "product-362890-settings-cost-color": "rgba( 29, 77, 65, 1 )",
            "product-362890-settings-cost-font-size": "20",
            "product-362890-settings-cost-text": "{{points}} POINTS",
            "product-362890-settings-hidden": "false",
            "product-362890-settings-out-of-stock": "false",
            "product-362890-settings-redeem-button-color":
              "rgba( 29, 77, 65, 1 )",
            "product-362890-settings-redeem-button-text": "REDEEM NOW",
            "product-362890-settings-redeem-button-text-color":
              "rgba( 29, 77, 65, 1 )",
            "product-362890-settings-redeem-button-type": "rectangular_outline",
            "product-362890-settings-restrict-specific-tier": "false",
            "product-362890-settings-reward":
              "Travel Size Essential Corrective Complex",
            "product-362890-settings-reward-color": "rgba( 29, 77, 65, 1 )",
            "product-362890-settings-reward-font-size": "18",
            "product-362890-settings-show-in-logged-out": "No",
            "product-362890-settings-variant-id": "32453693472842",
            "product-362892-displayname": "Travel Size Essential Hydrating Oil",
            "product-362892-settings-background-border-color":
              "rgba( 0, 0, 0, 0 )",
            "product-362892-settings-background-fill-color": "#ffffff",
            "product-362892-settings-background-has-shadow": "true",
            "product-362892-settings-background-image-url":
              "https://cdn-swell-paperclip.yotpo.com/images/images/15906_1599664787.original.jpg?1599664787",
            "product-362892-settings-cancel-button-text-color": "#0f0c6d",
            "product-362892-settings-confirm-button-color":
              "rgba( 29, 77, 65, 1 )",
            "product-362892-settings-confirm-button-text-color": "#ffffff",
            "product-362892-settings-confirmation-step-cancel-option": "CANCEL",
            "product-362892-settings-confirmation-step-confirm-option":
              "YES, ADD IT",
            "product-362892-settings-cost": "100",
            "product-362892-settings-cost-color": "rgba( 29, 77, 65, 1 )",
            "product-362892-settings-cost-font-size": "20",
            "product-362892-settings-cost-text": "{{points}} POINTS",
            "product-362892-settings-hidden": "false",
            "product-362892-settings-out-of-stock": "false",
            "product-362892-settings-redeem-button-color":
              "rgba( 29, 77, 65, 1 )",
            "product-362892-settings-redeem-button-text": "REDEEM NOW",
            "product-362892-settings-redeem-button-text-color":
              "rgba( 29, 77, 65, 1 )",
            "product-362892-settings-redeem-button-type": "rectangular_outline",
            "product-362892-settings-restrict-specific-tier": "false",
            "product-362892-settings-reward":
              "Travel Size Essential Hydrating Oil",
            "product-362892-settings-reward-color": "rgba( 29, 77, 65, 1 )",
            "product-362892-settings-reward-font-size": "18",
            "product-362892-settings-show-in-logged-out": "No",
            "product-362892-settings-variant-id": "32453703958602",
            "redeem-button-color": "rgba( 29, 77, 65, 1 )",
            "redeem-button-text": "REDEEM NOW",
            "redeem-button-text-color": "rgba( 29, 77, 65, 1 )",
            "redeem-button-type": "rectangular_outline",
            "redemptions-background-border-color": "rgba( 0, 0, 0, 0 )",
            "redemptions-background-fill-color": "#ffffff",
            "redemptions-background-has-shadow": "true",
            "reward-color": "rgba( 29, 77, 65, 1 )",
            "reward-font-size": "18",
            "secondary-font-name-and-url":
              "ProximaNova@400|https://cdn.shopify.com/s/files/1/1368/9993/t/53/assets/FontsFree-Net-proxima_nova_reg-webfont.ttf?86776",
            "selected-extensions": ["362889", "362890", "362892"],
            "slides-next-button-image": "",
            "slides-prev-button-image": "",
            "status-failure-text": "We could not add this product to your cart",
            "status-success-text":
              "Success! This product has been successfully added to your cart.",
            "view-cart-link": "/cart",
            "view-cart-text": "VIEW CART",
          },
          staticContent: {
            cssEditorEnabled: "true",
            currency: "USD",
            merchantId: "65908",
            platformName: "shopify",
            storeLoginUrl: "/account/login",
          },
          className: "ProductsRedemptionWidget",
          dependencyGroupId: 2,
        },

        8016: {
          instanceId: "8016",
          instanceVersionId: "1136263",
          templateAssetUrl:
            "https://cdn-widget-assets.yotpo.com/widget-vip-tiers/app.v0.1.20-1625.js",
          cssOverrideAssetUrl:
            "https://cdn-widget-assets.yotpo.com/VipTiersWidget/DsuqaG0zlf2fAYBY85pxQw/css-overrides/css-overrides.2020_09_21_12_58_33_320.css",
          customizationCssUrl: "",
          customizations: {
            "current-status-bg-color": "rgba( 29, 77, 65, 1 )",
            "current-status-tag": "true",
            "current-status-text": "Your Current Status",
            "current-status-text-color": "rgba( 255, 255, 255, 1 )",
            "current-tier-benefits-color": "#FFFFFF",
            "current-tier-benefits-icon": "none",
            "current-tier-benefits-icon-color": "#FFFFFF",
            "current-tier-benefits-icon-url": "",
            "current-tier-bg-color": "rgba( 29, 77, 65, 1 )",
            "current-tier-border-color": "TRANSPARENT",
            "current-tier-icon": "none",
            "current-tier-icon-color": "#FFFFFF",
            "current-tier-icon-url": "",
            "current-tier-name-color": "rgba( 255, 255, 255, 1 )",
            "current-tier-threshold-color": "rgba( 255, 255, 255, 1 )",
            "headline-font-size": "36px",
            "headline-text-color": "rgba( 29, 77, 65, 1 )",
            "primary-font-name-and-url":
              "Orpheus@400|https://cdn.shopify.com/s/files/1/1368/9993/files/OrpheusW05-Regular.woff2?v=1586153014",
            "progress-bar-current-status": "{{amount_spent}} Spent",
            "progress-bar-enabled": "false",
            "progress-bar-headline-font-size": "14px",
            "progress-bar-primary-color": "#011247",
            "progress-bar-secondary-color": "#768cdc",
            "progress-bar-summary-current":
              "You have {{current_vip_tier_name}} through the next earning period.",
            "progress-bar-summary-font-size": "14px",
            "progress-bar-summary-maintain":
              "Spend {{spend_needed}} by {{tier_expiration_date}} to maintain {{current_vip_tier_name}}",
            "progress-bar-summary-next":
              "Spend {{spend_needed}} by {{tier_expiration_date}} to unlock {{next_vip_tier_name}}.",
            "progress-bar-tier-status": "Tier Status",
            "progress-bar-you": "YOU",
            "secondary-font-name-and-url":
              "ProximaNova@400|https://cdn.shopify.com/s/files/1/1368/9993/t/53/assets/FontsFree-Net-proxima_nova_reg-webfont.ttf?86776",
            "selected-extensions": ["4217", "082152", "4218", "4219"],
            "tier-spacing": "big",
            "tiers-082152-design-background-border-color":
              "rgba( 255, 255, 255, 1 )",
            "tiers-082152-design-background-color": "#FFFFFF",
            "tiers-082152-design-background-shadow": "true",
            "tiers-082152-design-benefits-font-size": "14px",
            "tiers-082152-design-benefits-icon-color": "rgba( 29, 77, 65, 1 )",
            "tiers-082152-design-benefits-icon-type": "none",
            "tiers-082152-design-benefits-text-color": "rgba( 29, 77, 65, 1 )",
            "tiers-082152-design-icon-fill-color": "#6C89E9",
            "tiers-082152-design-icon-type": "none",
            "tiers-082152-design-icon-url": "",
            "tiers-082152-design-name-font-size": "22px",
            "tiers-082152-design-name-text-color": "rgba( 29, 77, 65, 1 )",
            "tiers-082152-design-separator-color": "rgba( 29, 77, 65, 1 )",
            "tiers-082152-design-separator-type": "default",
            "tiers-082152-design-threshold-font-size": "18px",
            "tiers-082152-design-threshold-text-color": "rgba( 29, 77, 65, 1 )",
            "tiers-082152-text-benefits":
              "Free Shipping on orders $75+ (domestic only)||Birthday Bonus: 20% Off||Early Access to Sales \u0026 Promotions",
            "tiers-082152-text-name": "Azure",
            "tiers-082152-text-rank": "0",
            "tiers-082152-text-show-less-text": "- Show Less",
            "tiers-082152-text-show-more-text": "+ Show More",
            "tiers-082152-text-threshold": "Create An Account",
            "tiers-4217-design-background-border-color":
              "rgba( 255, 255, 255, 1 )",
            "tiers-4217-design-background-color": "#FFFFFF",
            "tiers-4217-design-background-shadow": "true",
            "tiers-4217-design-benefits-font-size": "14px",
            "tiers-4217-design-benefits-icon-color": "#6c89e9",
            "tiers-4217-design-benefits-icon-type": "none",
            "tiers-4217-design-benefits-text-color": "rgba( 29, 77, 65, 1 )",
            "tiers-4217-design-icon-fill-color": "#6c89e9",
            "tiers-4217-design-icon-type": "none",
            "tiers-4217-design-icon-url": "",
            "tiers-4217-design-name-font-size": "22px",
            "tiers-4217-design-name-text-color": "rgba( 29, 77, 65, 1 )",
            "tiers-4217-design-separator-color": "rgba( 29, 77, 65, 1 )",
            "tiers-4217-design-separator-type": "default",
            "tiers-4217-design-threshold-font-size": "18px",
            "tiers-4217-design-threshold-text-color": "rgba( 29, 77, 65, 1 )",
            "tiers-4217-text-benefits":
              "Free Standard Shipping||Birthday Bonus: 20% Off||Early Access to Sales \u0026 Promotions||Dedicated CS Phone Line",
            "tiers-4217-text-name": "Indigo",
            "tiers-4217-text-rank": "1",
            "tiers-4217-text-show-less-text": "- Show Less",
            "tiers-4217-text-show-more-text": "+ Show More",
            "tiers-4217-text-threshold": "Spend {{amount_spent}} - $499",
            "tiers-4218-design-background-border-color":
              "rgba( 255, 255, 255, 1 )",
            "tiers-4218-design-background-color": "#FFFFFF",
            "tiers-4218-design-background-shadow": "true",
            "tiers-4218-design-benefits-font-size": "14px",
            "tiers-4218-design-benefits-icon-color": "#6c89e9",
            "tiers-4218-design-benefits-icon-type": "none",
            "tiers-4218-design-benefits-text-color": "rgba( 29, 77, 65, 1 )",
            "tiers-4218-design-icon-fill-color": "rgba( 29, 77, 65, 1 )",
            "tiers-4218-design-icon-type": "none",
            "tiers-4218-design-icon-url": "",
            "tiers-4218-design-name-font-size": "22px",
            "tiers-4218-design-name-text-color": "rgba( 29, 77, 65, 1 )",
            "tiers-4218-design-separator-color": "rgba( 29, 77, 65, 1 )",
            "tiers-4218-design-separator-type": "default",
            "tiers-4218-design-threshold-font-size": "18px",
            "tiers-4218-design-threshold-text-color": "rgba( 29, 77, 65, 1 )",
            "tiers-4218-text-benefits":
              "Free 2-Day Shipping||Birthday Bonus: 20% Off||Early Access to Sales \u0026 Promotions||Dedicated CS Phone Line||Quarterly Exclusive Promotion||Early Access to New Products||Seasonal Virtual Consultation",
            "tiers-4218-text-name": "Emerald",
            "tiers-4218-text-rank": "2",
            "tiers-4218-text-show-less-text": "- Show Less",
            "tiers-4218-text-show-more-text": "+ Show More",
            "tiers-4218-text-threshold": "Spend {{amount_spent}} - $749",
            "tiers-4219-design-background-border-color":
              "rgba( 255, 255, 255, 1 )",
            "tiers-4219-design-background-color": "#FFFFFF",
            "tiers-4219-design-background-shadow": "true",
            "tiers-4219-design-benefits-font-size": "14px",
            "tiers-4219-design-benefits-icon-color": "#6c89e9",
            "tiers-4219-design-benefits-icon-type": "none",
            "tiers-4219-design-benefits-text-color": "rgba( 29, 77, 65, 1 )",
            "tiers-4219-design-icon-fill-color": "#6c89e9",
            "tiers-4219-design-icon-type": "none",
            "tiers-4219-design-icon-url": "",
            "tiers-4219-design-name-font-size": "22px",
            "tiers-4219-design-name-text-color": "rgba( 29, 77, 65, 1 )",
            "tiers-4219-design-separator-color": "rgba( 29, 77, 65, 1 )",
            "tiers-4219-design-separator-type": "default",
            "tiers-4219-design-threshold-font-size": "18px",
            "tiers-4219-design-threshold-text-color": "rgba( 29, 77, 65, 1 )",
            "tiers-4219-text-benefits":
              "Free 2-Day Shipping||Birthday Bonus: 20% Off||Early Access to Sales \u0026 Promotions||Dedicated CS Phone Line||Quarterly Exclusive Promotion||Early Access to New Products||Seasonal Virtual Consultation||Facialist Visit",
            "tiers-4219-text-name": "Diamond Exclusive",
            "tiers-4219-text-rank": "3",
            "tiers-4219-text-show-less-text": "- Show Less",
            "tiers-4219-text-show-more-text": "+ Show More",
            "tiers-4219-text-threshold": "Spend {{amount_spent}}+",
            "widget-background-color": "#f5f5f5",
            "widget-headline": "OSEA VIPS",
          },
          staticContent: {
            cssEditorEnabled: "true",
            currency: "USD",
            merchantId: "65908",
            platformName: "shopify",
          },
          className: "VipTiersWidget",
          dependencyGroupId: null,
        },

        8015: {
          instanceId: "8015",
          instanceVersionId: "1136262",
          templateAssetUrl:
            "https://cdn-widget-assets.yotpo.com/widget-referral-widget/app.v1.6.28-2677.js",
          cssOverrideAssetUrl:
            "https://cdn-widget-assets.yotpo.com/ReferralWidget/DsuqaG0zlf2fAYBY85pxQw/css-overrides/css-overrides.2020_09_21_12_57_54_926.css",
          customizationCssUrl: "",
          customizations: {
            "background-color": "rgba( 222, 206, 182, 1 )",
            "background-image-url":
              "https://cdn-widget-assets.yotpo.com/static_assets/DsuqaG0zlf2fAYBY85pxQw/images/image_2020_09_18_00_33_42_885",
            "customer-email-view-button-text": "NEXT",
            "customer-email-view-description":
              "Give your friends $20 off on their first order of $80+ and get $20 off your next order of $80+ for each successful referral.",
            "customer-email-view-header": "",
            "customer-email-view-title": "Share the Love",
            "default-toggle": true,
            "description-color": "rgba( 0, 0, 0, 1 )",
            "description-font-size": "20px",
            "final-view-button-text": "REFER MORE FRIENDS",
            "final-view-description":
              "Remind your friends to check their emails.",
            "final-view-error-description":
              "We were unable to send the referral link. This may be because that email is already associated to an existing customer or the email was spelled incorrectly. ",
            "final-view-error-text": "GO BACK",
            "final-view-error-title": "SOMETHING WENT WRONG",
            "final-view-title": "THANKS FOR REFERRING",
            "fonts-primary-font-name-and-url":
              "Orpheus@400|https://cdn.shopify.com/s/files/1/1368/9993/files/OrpheusW05-Regular.woff2?v=1586153014",
            "fonts-secondary-font-name-and-url":
              "ProximaNova@400|https://cdn.shopify.com/s/files/1/1368/9993/t/53/assets/FontsFree-Net-proxima_nova_reg-webfont.ttf?86239",
            "header-color": "rgba( 29, 77, 65, 1 )",
            "header-font-size": "18px",
            "main-share-option-desktop": "main_share_email",
            "main-share-option-mobile": "main_share_email",
            "next-button-background-color": "rgba( 249, 247, 244, 1 )",
            "next-button-font-size": "18px",
            "next-button-size": "large",
            "next-button-text-color": "rgba( 29, 77, 65, 1 )",
            "next-button-type": "filled_rectangle",
            "referral-history-completed-points-text": "{{points}} POINTS",
            "referral-history-completed-status-type": "text",
            "referral-history-confirmed-status": "COMPLETED",
            "referral-history-pending-status": "PENDING",
            "referral-history-points-reward": 0,
            "referral-history-redeem-text":
              "When your friend places a purchase through your unique referral link, you will receive a $20 coupon code via email. ",
            "referral-history-sumup-line-points-text": "{{points}} POINTS",
            "referral-history-sumup-line-text": "Your Rewards",
            "referral-views-button-text": "SHARE SAFE SKINCARE",
            "referral-views-copy-link-button-text": "COPY LINK",
            "referral-views-description":
              "Give your friends $20 off on their first order of $80+ and get $20 off your next order of $80+ for each successful referral.",
            "referral-views-email-share-body":
              "How does a discount off your first order at {{company_name}} sound? Use the link below and once you've shopped, I'll get a reward too.\n{{referral_link}}",
            "referral-views-email-share-subject":
              "Discount to a Store You'll Love!",
            "referral-views-email-share-type": "marketing_email",
            "referral-views-header": "",
            "referral-views-personal-email-button-text": "SEND VIA MY EMAIL",
            "referral-views-sms-button-text": "SEND VIA SMS",
            "referral-views-title": "Share the Love",
            "referral-views-whatsapp-button-text": "SEND VIA WHATSAPP",
            "share-allow-copy-link": true,
            "share-allow-email": true,
            "share-allow-facebook": true,
            "share-allow-sms": true,
            "share-allow-twitter": true,
            "share-allow-whatsapp": "false",
            "share-facebook-description":
              "You’ll love {{company_name}} as much as I do",
            "share-facebook-header": "Earn A Discount When You Shop Today!",
            "share-facebook-image-url": "",
            "share-icons-color": "rgba( 29, 77, 65, 1 )",
            "share-settings-copyLink": true,
            "share-settings-default-checkbox": true,
            "share-settings-default-mobile-checkbox": true,
            "share-settings-email": true,
            "share-settings-facebook": true,
            "share-settings-fbMessenger": true,
            "share-settings-mobile-copyLink": true,
            "share-settings-mobile-email": true,
            "share-settings-mobile-facebook": true,
            "share-settings-mobile-fbMessenger": true,
            "share-settings-mobile-sms": true,
            "share-settings-mobile-twitter": true,
            "share-settings-mobile-whatsapp": true,
            "share-settings-twitter": true,
            "share-settings-whatsapp": true,
            "share-sms-message":
              "I love {{company_name}}! Shop through my link to get a reward {{referral_link}}",
            "share-twitter-message":
              "These guys are great! Get a discount using my link: ",
            "share-whatsapp-message":
              "I love {{company_name}}! Shop through my link to get a reward {{referral_link}}",
            "tab-size": "small",
            "tab-type": "lower_line",
            "tab-view-primary-tab-text": "REFER A FRIEND",
            "tab-view-secondary-tab-text": "YOUR REFERRALS",
            "tile-color": "rgba( 222, 206, 182, 1 )",
            "title-color": "rgba( 29, 77, 65, 1 )",
            "title-font-size": "48px",
            "view-exit-intent-enabled": false,
            "view-exit-intent-mobile-timeout-ms": 10000,
            "view-is-popup": false,
            "view-layout": "right",
            "view-popup-delay-ms": 0,
            "view-show-popup-on-exit": false,
            "view-show-referral-history": "false",
            "view-table-rectangular-dark-pending-color":
              "rgba( 255, 255, 255, 1 )",
            "view-table-rectangular-light-pending-color": "#FFFFFF",
            "view-table-selected-color": "#558342",
            "view-table-theme": "dark",
            "view-table-type": "rectangular",
            "wadmin-text-and-share-choose-sreen": "step_1",
          },
          staticContent: {
            companyName: "OSEA® Malibu",
            cssEditorEnabled: "true",
            currency: "USD",
            hasPrimaryFontsFeature: true,
            merchantId: "65908",
            migrateTabColorToBackground: true,
            platformName: "shopify",
            referralHistoryEnabled: true,
            referralHost: "http://rwrd.io",
          },
          className: "ReferralWidget",
          dependencyGroupId: 2,
        },
      },
      guidStaticContent: {},
      dependencyGroups: {
        2: [
          "https://cdn-widget-assets.yotpo.com/widget-vue-core/app.v0.1.0-2295.js",
        ],
      },
    },
    initializer:
      "https://cdn-widget-assets.yotpo.com/widgets-initializer/app.v0.0.42-2673.js",
    analytics: "https://p.yotpo.com/js/bundle.js",
  };
  const initWidgets = function (config) {
    const widgetInitializer =
      yotpoWidgetsContainer["yotpo_widget_initializer"](config);
    return widgetInitializer.initWidgets();
  };
  const onInitializerLoad = function (config) {
    const prevInitWidgets = yotpoWidgetsContainer.initWidgets;
    yotpoWidgetsContainer.initWidgets = function () {
      if (prevInitWidgets) {
        if (typeof Promise !== "undefind" && Promise.all) {
          return Promise.all([prevInitWidgets(), initWidgets(config)]);
        }
        console.warn("[deprecated] promise is not supported in initWidgets");
        prevInitWidgets();
      }
      return initWidgets(config);
    };
    const guidWidgetContainer = getGuidWidgetsContainer();
    guidWidgetContainer.initWidgets = function () {
      return initWidgets(config);
    };
    guidWidgetContainer.initWidgets();
  };
  function getGuidWidgetsContainer() {
    if (!yotpoWidgetsContainer.guids) {
      yotpoWidgetsContainer.guids = {};
    }
    if (!yotpoWidgetsContainer.guids[guid]) {
      yotpoWidgetsContainer.guids[guid] = {};
    }
    return yotpoWidgetsContainer.guids[guid];
  }
  const guidWidgetContainer = getGuidWidgetsContainer();
  if (!guidWidgetContainer.yotpo_widget_scripts_loaded) {
    guidWidgetContainer.yotpo_widget_scripts_loaded = true;
    guidWidgetContainer.onInitializerLoad = function () {
      onInitializerLoad(loader.config);
    };
    loader.loadDep(loader.analytics, function () {}, "defer");

    loader.loadDep(
      loader.initializer,
      function () {
        guidWidgetContainer.onInitializerLoad();
      },
      "async"
    );
  }
})();
