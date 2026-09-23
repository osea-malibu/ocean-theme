var smsbump_checkout_widget = (function () {
  var config = {
    consent_message:
      "* By checking this box I consent to receive recurring automated marketing by text message through an automatic telephone dialing system. Consent is not a condition to purchase. Message and Data rate apply. Opt-Out by texting STOP.",
    checkbox_title: "Get discount on your next order",
    checkbox_label: "Sign up for our text club and we will text you a discount code.*",
    privacy_policy_text: "View Privacy Policy",
    privacy_policy_link: "#",
    checkbox_state: "unchecked",
    has_title: false,
    has_box: false,
    consent_text_position: "after_buttons",
  };

  function useCustomConfig(_config) {
    config.consent_message = _config.consent_message || config.consent_message;
    config.checkbox_title = _config.checkbox_title || config.checkbox_title;
    config.checkbox_label = _config.checkbox_label || config.checkbox_label;
    config.privacy_policy_text = _config.privacy_policy_text || config.privacy_policy_text;
    config.privacy_policy_link = _config.privacy_policy_link || config.privacy_policy_link;
    config.has_title = _config.has_title || config.has_title;
    config.has_box = _config.has_box || config.has_box;
    config.consent_text_position = _config.consent_text_position || config.consent_text_position;
  }

  function appendCheckboxHtml(apendAfterElement) {
    var checkboxHtml = '<div class="field field--optional">';

    if (config.has_box) {
      checkboxHtml += '<div class="section__content" style="padding: 14px 12px; border: 1px solid #d9d9d9; border-radius: 7px; background-color: #fbfbfb;">';
    } else {
      checkboxHtml += '<div class="section__content">';
    }

    checkboxHtml += '<div class="checkbox-wrapper">';
    checkboxHtml += '<div class="checkbox__input">';
    if (config.checkbox_state == "unchecked") {
      checkboxHtml += '<input class="input-checkbox" type="checkbox" id="smsbump-checkout-messages-subscription">';
    } else {
      checkboxHtml += '<input class="input-checkbox" type="checkbox" id="smsbump-checkout-messages-subscription" checked>';
    }
    checkboxHtml += "</div>";
    checkboxHtml += '<label class="checkbox__label" for="smsbump-checkout-messages-subscription" style="font-size: 13px;">';
    if (config.has_title) {
      checkboxHtml += '<span style="display: block; font-size: 14px; font-weight: 700; margin-bottom: 1px;">';
      checkboxHtml += config.checkbox_title;
      checkboxHtml += "</span>";
    }
    checkboxHtml += config.checkbox_label;
    checkboxHtml += "</label>";
    checkboxHtml += "</div>";
    checkboxHtml += "</div>";
    checkboxHtml += "</div>";

    var div = document.createElement("div");
    div.innerHTML = checkboxHtml.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    var checkboxNode = div.firstChild;

    apendAfterElement.parentNode.insertBefore(checkboxNode, apendAfterElement.nextSibling);

    return document.getElementById("smsbump-checkout-messages-subscription");
  }

  function appendConsentMessageHtml(apendAfterElement) {
    var p = document.createElement("p");
    p.id = "smsbump-consent-message";
    p.innerHTML = config.consent_message + ' <a href="' + config.privacy_policy_link + '">' + config.privacy_policy_text + "</a>";

    if (config.has_title) {
      p.style.cssText = "margin-top: 1em; color: #696969; font-size: 12px;";
    } else {
      p.style.cssText = "margin-top: 1em; color: #696969;";
    }

    apendAfterElement.parentNode.insertBefore(p, config.consent_text_position === "after_checkbox" ? apendAfterElement : apendAfterElement.nextSibling);
  }

  function smsBumpWidgetCheckboxListener(button, initialState) {
    if (!button) {
      setTimeout(smsBumpWidgetCheckboxListener, 50);
      return;
    }

    var smsbump_sh_store = "";
    var token = Shopify.Checkout.token;
    if (Shopify.shop != undefined) {
      smsbump_sh_store = Shopify.shop;
    } else if (Shopify.Checkout.apiHost != undefined) {
      smsbump_sh_store = Shopify.Checkout.apiHost;
    }

    if (initialState == "unchecked") {
      button.checked = false;
      addCheckoutMarketingUnsubscribed(smsbump_sh_store, token);
    } else {
      button.checked = true;
      removeCheckoutMarketingUnsubscribed(smsbump_sh_store, token);
    }
    button.addEventListener("change", function (e) {
      if (this.checked) {
        removeCheckoutMarketingUnsubscribed(smsbump_sh_store, token);
      } else {
        addCheckoutMarketingUnsubscribed(smsbump_sh_store, token);
      }
    });
  }

  function removeCheckoutMarketingUnsubscribed(sh_store, token) {
    var http = new XMLHttpRequest();
    var url = "https://shopify-checkouts.smsbump.com/remove-checkout-marketing-unsubscribed";

    http.open("POST", url, true);

    var data = new FormData();
    data.append("store", sh_store);
    data.append("checkout_token", token);

    http.onreadystatechange = function () {
      if (http.readyState == 4 && http.status == 200) {
        console.log("subscribed for future text marketing messages");
      }
    };

    http.send(data);
  }

  function addCheckoutMarketingUnsubscribed(sh_store, token) {
    var http = new XMLHttpRequest();
    var url = "https://shopify-checkouts.smsbump.com/add-checkout-marketing-unsubscribed";

    http.open("POST", url, true);

    var data = new FormData();
    data.append("store", sh_store);
    data.append("checkout_token", token);

    http.onreadystatechange = function () {
      if (http.readyState == 4 && http.status == 200) {
        console.log("unsubscribed from future text marketing messages");
      }
    };

    http.send(data);
  }

  function checkState(sh_store, token, callback) {
    var http = new XMLHttpRequest();
    var main_url = "https://shopify-checkouts.smsbump.com/check-checkout-marketing-unsubscribed";

    var url = main_url + "?sh_store=" + encodeURI(sh_store) + "&c_token=" + encodeURI(token);
    var state = "unchecked";
    http.open("GET", url, true);

    var data = new FormData();
    data.append("store", sh_store);
    data.append("checkout_token", token);

    http.onload = function () {
      if (http.readyState == 4 && http.status == 200) {
        var response = JSON.parse(http.response);
        if (response.state == "1") {
          state = "checked";
        } else {
          state = "unchecked";
        }

        return callback(state);
      }
    };

    http.send(data);
  }

  var domIsReady = (function (domIsReady) {
    var isBrowserIeOrNot = function () {
      return !document.attachEvent || typeof document.attachEvent === "undefined" ? "not-ie" : "ie";
    };

    domIsReady = function (callback) {
      if (callback && typeof callback === "function") {
        if (isBrowserIeOrNot() !== "ie") {
          document.addEventListener("DOMNodeInserted", function () {
            return callback();
          });
        } else {
          document.attachEvent("onreadystatechange", function () {
            if (document.readyState === "complete") {
              return callback();
            }
          });
        }
      } else {
        console.error("The callback is not a function!");
      }
    };

    return domIsReady;
  })(domIsReady || {});

  var init = function (config) {
    if (config) {
      useCustomConfig(config);
    }

    domIsReady(function () {
      const checkbox = document.getElementById("smsbump-checkout-messages-subscription");

      if (typeof Shopify != "undefined" && typeof Shopify.Checkout != "undefined" && !checkbox) {
        //Find the postcode field in the Shipping Address so we can append the checkbox
        var phoneField = document.querySelector("[data-address-fields]");

        if (phoneField) {
          var smsBumpCheckbox = appendCheckboxHtml(phoneField);
          if (smsBumpCheckbox != "undefined") {
            var smsbump_sh_store = "";
            var token = Shopify.Checkout.token;
            if (Shopify.shop != undefined) {
              smsbump_sh_store = Shopify.shop;
            } else if (Shopify.Checkout.apiHost != undefined) {
              smsbump_sh_store = Shopify.Checkout.apiHost;
            }
            checkState(smsbump_sh_store, token, function (state) {
              smsBumpWidgetCheckboxListener(smsBumpCheckbox, state);
            });
          }

          var step_footer = document.querySelector('[data-step="contact_information"] [data-step-footer]');

          var consent_message = document.getElementById("smsbump-consent-message");

          if (step_footer && !consent_message) {
            appendConsentMessageHtml(step_footer);
          }
        }
      }
    });
  };

  return {
    init: function (config) {
      return init(config);
    },
  };
})();
