/*  Loop Subscription Bundle Snippet v3.1

Created and maintained by LOOP SUBSCRIPTIONS (https://apps.shopify.com/loop-subscriptions)
DO NOT modify source code of this file because
- It is an automatically generated file from LOOP SUBSCRIPTIONS backend.
- LOOP SUBSCRIPTIONS will keep releasing new versions of this file. You can check the latest version
  available by visiting Loop Admin > Bundles > Snippets > Install bundle snippet.
- Updating will replace the existing file implying that all the custom code on the existing file 
  (if any) will be lost. 
- If you need to make changes, please do it using our standard bundle style settings available inside each bundle details page on Loop admin portal.
If you need any help, please contact us at support@loopwork.co.
*/

const BUNDLE_LINK_PREFIX = "/a/loop_subscriptions/bundle";
const LOOP_BUNDLE_URL = "https://api-service.loopwork.co/bundleTransaction/getBundleCartDetails";
const LOOP_API_SERVICE_URL = "https://api-service.loopwork.co";
let BUNDLE_CONTAINER_CLASS = "BUNDLE_CONTAINER_CLASS";
let CART_SUBTOTAL_CLASS = "CART_SUBTOTAL_CLASS";

//dev
// const LOOP_BUNDLE_URL =
//   "https://dev-api-service.loopwork.co/bundleTransaction/getBundleCartDetails";
// const LOOP_API_SERVICE_URL = "https://dev-api-service.loopwork.co";

//prod
// const LOOP_BUNDLE_URL =
//   "https://api-service.loopwork.co/bundleTransaction/getBundleCartDetails";
// const LOOP_API_SERVICE_URL = "https://api-service.loopwork.co";

const getItemsHtmlLoop = (item, bundleQuantityMapping) => {
    let quantity = item.quantity;
    if (bundleQuantityMapping) {
        let variant = bundleQuantityMapping.find(
            (v) => v.childProductId === item.id
        );
        if (variant) {
            quantity = variant.quantity;
        }
    }
    return `<p><span style="display:block;" class="data-cart-item-selling-plan-name">${
        item.title || ""
    } x ${quantity || ""}</span></p>`;
};

const getEditCartButton = (bundleTransactionId) => {
    return `<button onclick="event.preventDefault(); changeBundleCartItems('${bundleTransactionId}');" style="background:none;border:none;display:flex;align-items:center;gap:3px;cursor:pointer;padding:0; text-decoration:underline;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pen" viewBox="0 0 17 17">
            <path fill-rule="evenodd" d="M15.655 4.344a2.695 2.695 0 0 0-3.81 0l-.599.599-.009-.009-1.06 1.06.008.01-5.88 5.88a2.75 2.75 0 0 0-.805 1.944v1.922a.75.75 0 0 0 .75.75h1.922a2.75 2.75 0 0 0 1.944-.806l7.54-7.539a2.695 2.695 0 0 0 0-3.81Zm-4.409 2.72-5.88 5.88a1.25 1.25 0 0 0-.366.884v1.172h1.172c.331 0 .65-.132.883-.366l5.88-5.88-1.689-1.69Zm2.75.629.599-.599a1.195 1.195 0 1 0-1.69-1.689l-.598.599 1.69 1.689Z"></path>
        </svg>
        <p style="padding:0px;margin:0px;margin-top:5px">Edit</p>
    </button>`;
};

const getBundleCartTableTemplateLoop = (bundleItem, index, bundleLink) => {
  console.log("ffafaaf")
    return `
  <tr class="cart-item td:py-2 relative" id="CartBundleItem-${index}" >
                  <td class="cart-item__media shrink-0">
                    
                      <a href="${bundleLink}"  tabindex="-1">
                        <img class="cart-item__image shrink-0" src="${
                bundleItem.image || ""
            }" alt="" loading="lazy" width="60" height="77">
                      </a>
                    
                  </td>

                  <td class="cart-item__details">
                    
                      <a href="${bundleLink}" class="cart-item__name link leading-tight block mb-1">${
        bundleItem.label
    }</a>
     ${bundleItem.items
                    .map((item) => getItemsHtmlLoop(item))
                    .join("")}
                  <br/>
                    
<div>
                         ${bundleItem.price}
                      </div><dl></dl></td>

                  <td class="cart-item__quantity align-top">
                    <div class="flex items-center absolute sm:relative -right-2 top-10 sm:top-0 sm:right-0"><label class="sr-only" >
                          Quantity
                        </label>
                        <quantity-input class="quantity inline-flex border border-seaweed-400 rounded-md mr-2">
                          <button class="quantity__button no-js-hidden cursor-pointer flex items-center justify-center shrink-0 w-6 h-6 border -mt-px -mb-px -ml-px box-content border-transparent rounded-l-md hover:bg-seafoam-100 hover:border-seaweed-500 motion-safe:transition-colors" disabled >
                           
                            


                          </button>
                          <input class="quantity__input w-8 h-6 border-0 p-1 text-center" type="number" value="1" min="0" disabled>
                          <button class="quantity__button no-js-hidden cursor-pointer flex items-center justify-center shrink-0 w-6 h-6 border -mt-px -mb-px -mr-px box-content border-transparent rounded-r-md hover:bg-seafoam-100 hover:border-seaweed-500 motion-safe:transition-colors" disabled>
                          
                            



                          </button>
                        </quantity-input><cart-remove-button class="hidden sm:block" >
                        <a onclick="removeBundleLoop('${
              bundleItem.bundleId
          }')" class="block button button-secondary button-sm px-2" >
                          

<svg aria-hidden="true" focusable="false" class="w-4 h-4 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="3 6 5 6 21 6"></polyline>
  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  <line x1="10" y1="11" x2="10" y2="17"></line>
  <line x1="14" y1="11" x2="14" y2="17"></line>
</svg>
                        </a>
                      </cart-remove-button>
                    </div>
                    <div class="cart-item__error text-coral-800 hidden" id="Line-item-error-1" role="alert">
                      <small class="cart-item__error-text"></small>
                      

<svg aria-hidden="true" focusable="false" class="icon icon-error w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"></circle>
  <line x1="12" y1="8" x2="12" y2="12"></line>
  <line x1="12" y1="16" x2="12.01" y2="16"></line>
</svg>
                    </div>
                  </td>

                  <td class="cart-item__totals flex flex-row justify-end items-center text-right relative">
                    <div class="loading-spinner hidden mr-2 -ml-6">
                      

<svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="" stroke-linecap="round" stroke-linejoin="round">
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>
                    </div>

                    <div class="cart-item__price-wrapper"><span class="price price--end">
                        ${bundleItem.price}
                        </span></div>
                  </td>
                </tr>
    `;
};

const getBundleCartDrawerTemplateLoop = (bundleItem, index, bundleLink) => {
  console.log(bundleItem)
    return `
  <tr id="${bundleItem.bundleId ? 'bud' : 'simp'}" class="cart-item align-top my-6 grid grid-cols-7 grid-rows-auto [grid-template-areas:'image_name_name_name_name_name_price''image_size_size_sub_sub_sub_sub''image_quant_quant_sub_sub_sub_sub'] td:border-collapse td:border-spacing-0 td:border-0"
role="row">
  <td class="cart-item__media p-0 [grid-area:image]" role="cell" headers="CartDrawer-ColumnImage">
    <div class="flex h-full items-center">
      <a href="${bundleLink}" class="sr-only"
      tabindex="-1" aria-hidden="true">
      </a>
      <img class="cart-item__image max-w-full" 
      src="${
                bundleItem.image || ""
            }"
       width="60" height="77">
    </div>
  </td>
  <td class="cart-item__name p-0 [grid-area:name]" role="cell" headers="CartDrawer-ColumnName">
    <div class="flex items-center h-full">
      <a href="${bundleLink}" class="block leading-none 2xs:w-full w-60">
      ${
        bundleItem.label
    }
      </a>
    </div>
  </td>
  <td class="cart-item__size p-0 [grid-area:size]" role="cell" headers="CartDrawer-ColumnSize">
    <dl class="flex items-center h-full text-sm pb-1 gap-2">
      <div class="product-option flex">
        <dt class="mr-1">
         ${bundleItem.items
                .map((item) =>
                    getItemsHtmlLoop(item, bundleItem.bundleQuantityMapping)
                )
                .join("")}
        </dt>
        <dd class="whitespace-nowrap">
       <p><span>${bundleItem.sellingPlan || ""}</span></p>
        </dd>
      </div>
    </dl>
  </td>
  <td class="cart-item__quantity p-0 [grid-area:quant]" role="cell" headers="CartDrawer-ColumnQuantity">
    <div class="flex items-center">
      <quantity-input class="quantity inline-flex border border-seaweed-400 rounded-md mr-1">
       
        <input class="quantity__input w-8 h-6 border-0 p-1 text-center" type="number" min="0" value="${bundleItem.quantity}" readonly>

      
        
      </quantity-input>
      <cart-remove-button  class="hidden xs:block">
        <button class="block button button-secondary button-sm px-2" onclick="removeBundleLoop('${
                bundleItem.bundleId
            }')"
         type="button">
          <svg aria-hidden="true" focusable="false" class="w-4 h-4 pointer-events-none"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6">
            </polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
            </path>
            <line x1="10" y1="11" x2="10" y2="17">
            </line>
            <line x1="14" y1="11" x2="14" y2="17">
            </line>
          </svg>
        </button>
      </cart-remove-button>
    </div>
    <div  class="absolute text-coral-800 text-sm hidden"
    role="alert">
      <small class="cart-item__error-text">
      </small>
      <svg aria-hidden="true" focusable="false" class="icon icon-error w-4 h-4"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10">
        </circle>
        <line x1="12" y1="8" x2="12" y2="12">
        </line>
        <line x1="12" y1="16" x2="12.01" y2="16">
        </line>
      </svg>
    </div>
  </td>
  <td class="cart-item__totals p-0 [grid-area:price]" role="cell" headers="CartDrawer-ColumnTotal">
    <div class="flex items-center justify-end h-full">
      <div class="loading-spinner hidden mr-2">
        <svg class="animate-spin w-4 h-4 text-wave-800" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="" stroke-linecap="round" stroke-linejoin="round">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
          stroke-width="4">
          </circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
      </div>
      <div class="cart-item__price-wrapper h-full flex items-center justify-end motion-safe:transition-opacity" style="
    text-decoration: line-through;
">
        <span class="flex">
          ${bundleItem.priceWithoutDiscount}
        </span>
      </div>
      <div class="cart-item__price-wrapper h-full flex items-center justify-end motion-safe:transition-opacity">
        <span class="flex">
         ${bundleItem.final_line_price_currency}
        </span>
      </div>
    </div>
  </td>
</tr>
    `;
};

const getBundleCartItemsDivTemplateLoop = (bundleItem, index, bundleLink) => {
    return `
        <div style="display:flex; gap:20px; justify-content: space-between;" id="CartBundleItem-${index}">
          <div style="display:flex; gap:20px;">
            <div style="text-align:center;">
              <img
                src="${bundleItem.image || ""}" 
                alt="${bundleItem.label}" loading="lazy" width="75" height="75">
            </div>
            <div>
              <a href="${bundleLink}" 
                 style="font-weight:600">
                ${bundleItem.label || ""}
              </a>
              <div>
                ${bundleItem.items
                    .map((item) => getItemsHtmlLoop(item))
                    .join("")}
                  <br/>
                  <p><span>${bundleItem.sellingPlan || ""}</span></p>
              </div>
            </div>
          </div>
          <div>
            ${bundleItem.quantity}
          </div>
          <div>
            <div style="display: flex; gap: 10px;">
              <span style="text-decoration:line-through;"> 
               ${bundleItem.priceWithoutDiscount}
              </span>
              <span style="font-weight: 600;">${bundleItem.price}</span>
            </div>
            ${getEditCartButton(bundleItem.bundleId)}
            <div onclick="removeBundleLoop('${
                bundleItem.bundleId
            }')" style="cursor:pointer; vertical-align: text-top; width: fit-content;height: 15px;display: inline-flex;flex-direction: row-reverse;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" style="width: 1em; height: 1em;" aria-hidden="true" focusable="false" role="presentation" class="icon icon-remove">
                    <path d="M14 3h-3.53a3.07 3.07 0 00-.6-1.65C9.44.82 8.8.5 8 .5s-1.44.32-1.87.85A3.06 3.06 0 005.53 3H2a.5.5 0 000 1h1.25v10c0 .28.22.5.5.5h8.5a.5.5 0 00.5-.5V4H14a.5.5 0 000-1zM6.91 1.98c.23-.29.58-.48 1.09-.48s.85.19 1.09.48c.2.24.3.6.36 1.02h-2.9c.05-.42.17-.78.36-1.02zm4.84 11.52h-7.5V4h7.5v9.5z" fill="currentColor"></path>
                    <path d="M6.55 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5zM9.45 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5z" fill="currentColor"></path>
              </svg>
            </div>
          </div>
        </div>
    `;
};

const getPresetBundleCartTemplateLoop = (bundleItem, index, bundleLink) => {
    return `
        <tr class="cart-item" id="CartBundleItem-${index}">
    <td class="cart-item__media">
        <a href="${bundleLink}" class="cart-item__link" aria-hidden="true" tabindex="-1"> </a>
          <div class="cart-item__image-container gradient global-media-settings">
            <img src="${
                bundleItem.image || ""
            }"  class="cart-item__image" alt="" loading="lazy" width="150" height="94">
          </div>
    </td>

    <td class="cart-item__details"><a href="${bundleLink}" class="cart-item__name h4 break">${
        bundleItem.label
    }</a>
        <div class="product-option">
            ${bundleItem.items
                .map((item) =>
                    getItemsHtmlLoop(item, bundleItem.bundleQuantityMapping)
                )
                .join("")}
              <br/>
        </div>
        <div class="product-option">
         ${bundleItem.eachBundleAmount}
        </div><dl></dl>

        <p class="product-option">${bundleItem.sellingPlan || ""}</p>
        ${
            bundleItem.discountTitle
                ? `<ul class="discounts list-unstyled" role="list" aria-label="Discount">
            <li class="discounts__discount">
                <svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-discount color-foreground-text" viewBox="0 0 12 12">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M7 0h3a2 2 0 012 2v3a1 1 0 01-.3.7l-6 6a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4l6-6A1 1 0 017 0zm2 2a1 1 0 102 0 1 1 0 00-2 0z" fill="currentColor">
                    </path>
                </svg>
                ${bundleItem.discountTitle}
            </li>
        </ul>`
                : ""
        }
    </td>

    <td class="cart-item__totals right medium-hide large-up-hide">
      <div class="cart-item__price-wrapper"><span class="price price--end">
           ${bundleItem.final_line_price}
          </span></div>
    </td>

    <td class="cart-item__quantity">
      <div class="cart-item__quantity-wrapper">
        <quantity-input class="quantity">
          <input disabled class="quantity__input" type="number" value="${
              bundleItem.bundleProductQuantity
          }" min="0">
        </quantity-input>
        <cart-remove-button>
          <a onclick="removeBundleLoop('${
              bundleItem.bundleId
          }')" class="button button--tertiary" aria-label="${
        bundleItem.label
    }" style="cursor : pointer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true" role="presentation" class="icon icon-remove">
                <path d="M14 3h-3.53a3.07 3.07 0 00-.6-1.65C9.44.82 8.8.5 8 .5s-1.44.32-1.87.85A3.06 3.06 0 005.53 3H2a.5.5 0 000 1h1.25v10c0 .28.22.5.5.5h8.5a.5.5 0 00.5-.5V4H14a.5.5 0 000-1zM6.91 1.98c.23-.29.58-.48 1.09-.48s.85.19 1.09.48c.2.24.3.6.36 1.02h-2.9c.05-.42.17-.78.36-1.02zm4.84 11.52h-7.5V4h7.5v9.5z" fill="currentColor"></path>
                <path d="M6.55 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5zM9.45 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5z" fill="currentColor"></path>
            </svg>
          </a>
        </cart-remove-button>
      </div>
    </td>

    <td class="cart-item__totals right small-hide">
      <div class="cart-item__price-wrapper"><span class="price price--end">
           ${bundleItem.final_line_price_currency}
          </span></div>
    </td>
  </tr>
    `;
};

const getPresetBundleCartDrawerTemplateLoop = (
    bundleItem,
    index,
    bundleLink
) => {
    return `
        <tr class="cart-item" id="CartBundleItem-${index}">
    <td class="cart-item__media">
        <a href="${bundleLink}" class="cart-item__link" aria-hidden="true" tabindex="-1"> </a>
          <div class="cart-item__image-container gradient global-media-settings">
            <img src="${
                bundleItem.image || ""
            }"  class="cart-item__image" alt="" loading="lazy" width="150" height="94">
          </div>
    </td>

    <td class="cart-item__details"><a href="${bundleLink}" class="cart-item__name h4 break">${
        bundleItem.label
    }</a>
                <div class="product-option">
            ${bundleItem.items
                .map((item) =>
                    getItemsHtmlLoop(item, bundleItem.bundleQuantityMapping)
                )
                .join("")}
              <br/>
        </div>
        <div class="product-option">
         ${bundleItem.eachBundleAmount}
        </div><dl></dl>

        <p class="product-option">${bundleItem.sellingPlan || ""}</p>
        ${
            bundleItem.discountTitle
                ? `<ul class="discounts list-unstyled" role="list" aria-label="Discount">
            <li class="discounts__discount">
                <svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-discount color-foreground-text" viewBox="0 0 12 12">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M7 0h3a2 2 0 012 2v3a1 1 0 01-.3.7l-6 6a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4l6-6A1 1 0 017 0zm2 2a1 1 0 102 0 1 1 0 00-2 0z" fill="currentColor">
                    </path>
                </svg>
                ${bundleItem.discountTitle}
            </li>
        </ul>`
                : ""
        }
    </td>

    <td class="cart-item__totals right medium-hide large-up-hide">
      <div class="cart-item__price-wrapper"><span class="price price--end">
           ${bundleItem.final_line_price}
          </span></div>
    </td>

    <td class="cart-item__quantity">
      <div class="cart-item__quantity-wrapper">
        <quantity-input class="quantity">
          <input disabled class="quantity__input" type="number" value="${
              bundleItem.bundleProductQuantity
          }" min="0">
        </quantity-input>
        <cart-remove-button>
          <a onclick="removeBundleLoop('${
              bundleItem.bundleId
          }')" class="button button--tertiary" aria-label="${
        bundleItem.label
    }" style="cursor : pointer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true" role="presentation" class="icon icon-remove">
                <path d="M14 3h-3.53a3.07 3.07 0 00-.6-1.65C9.44.82 8.8.5 8 .5s-1.44.32-1.87.85A3.06 3.06 0 005.53 3H2a.5.5 0 000 1h1.25v10c0 .28.22.5.5.5h8.5a.5.5 0 00.5-.5V4H14a.5.5 0 000-1zM6.91 1.98c.23-.29.58-.48 1.09-.48s.85.19 1.09.48c.2.24.3.6.36 1.02h-2.9c.05-.42.17-.78.36-1.02zm4.84 11.52h-7.5V4h7.5v9.5z" fill="currentColor"></path>
                <path d="M6.55 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5zM9.45 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5z" fill="currentColor"></path>
            </svg>
          </a>
        </cart-remove-button>
      </div>
    </td>

    <td class="cart-item__totals right small-hide">
      <div class="cart-item__price-wrapper"><span class="price price--end">
           ${bundleItem.final_line_price_currency}
          </span></div>
    </td>
  </tr>
    `;
};

// returns cart item key of a bundleId
const getItemKeysByBundleIdLoop = (bundleId) => {
    const cartItems = window.Loop.bundleCartAllItems;
    const data = {
        updates: {},
    };
    for (const item of cartItems) {
        const _bundleId =
            item?.properties?._bundleId ?? item?.properties?.bundleId;
        if (!_bundleId || _bundleId !== bundleId) continue;
        data.updates[item.key] = 0;
    }
    return data;
};

// removes a bundleId from cart
const removeBundleLoop = async (bundleId) => {
    const data = getItemKeysByBundleIdLoop(bundleId);
    const endpoint = `${window.Shopify.routes.root}cart/update.js`;
    await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    window.location.href = window.location.href;
};

const changeBundleCartItems = async (bundleTransactionId) => {
    disableEditButton();
    const currentLocale = window?.Shopify?.locale;
    const root = window?.Shopify?.routes?.root ?? "/";

    if (bundleTransactionId) {
        const _editBundleRef = `${BUNDLE_LINK_PREFIX}/change/${bundleTransactionId}`;
        if (currentLocale && root !== "/") {
            window.location.href = `/${currentLocale}${_editBundleRef}`;
        } else {
            window.location.href = _editBundleRef;
        }
    }
};

const disableEditButton = (bundleId) => {
    console.log(`disabling bundle edit button: ${bundleId}`);
    const editButttons = document.querySelectorAll(
        `loop-edit-bundle-${bundleId}`
    );
    for (const button of editButttons) {
        button.disabled = true;
    }
};

const fetchLoopBundleTransactionCartDetails = async (loopBundleGuid) => {
    const _endpoint = `${LOOP_BUNDLE_URL}/${loopBundleGuid}`;
    const _response = await fetch(_endpoint);
    return await _response.json();
};

const addExtraDetailsToBundleItemsLoop = async (bundleItems) => {
    let totalDiscount = 0;
    let currencySymbol = "";
    let currency = "";

    const fetchDetailsPromises = bundleItems.map((bundleItem) =>
        fetchLoopBundleTransactionCartDetails(bundleItem.bundleId)
    );
    const allExtraDetails = await Promise.all(fetchDetailsPromises);
    for (let i = 0; i < allExtraDetails.length; ++i) {
        const extraDetails = allExtraDetails[i];
        const bundleItem = bundleItems[i];
        const quantityMapping =
            extraDetails?.variantMap?.[bundleItem.bundleId] ?? [];
        const isPresetBundleProduct = bundleItem.isPresetBundleProduct;
        const totalBundleItemsQuantity = bundleItem.items.reduce(
            (acc, item) => acc + item.quantity,
            0
        );
        let price = isPresetBundleProduct
            ? bundleItem.discounted_price
            : bundleItem.price;

        bundleItem.label = extraDetails?.label;
        bundleItem.image = extraDetails?.image;
        bundleItem.sellingPlan = extraDetails?.name;
        bundleItem.priceWithoutDiscount = `${
            extraDetails.currencySymbol
        }${price.toFixed(2)}`;
        bundleItem.final_line_price_currency = `${
            extraDetails.currencySymbol
        }${parseFloat(bundleItem.final_line_price).toFixed(2)}`;
        bundleItem.loopBundleId = extraDetails.loopBundleId;
        currencySymbol = extraDetails.currencySymbol;
        currency = extraDetails.currency;

        if (
            extraDetails.discountType &&
            extraDetails.discountValue &&
            !isPresetBundleProduct
        ) {
            if (extraDetails.discountType === "PERCENTAGE") {
                if (extraDetails.appliesOnEachItem) {
                    // if discount in each item
                    totalDiscount +=
                        price *
                        (parseFloat(extraDetails.discountValue) / 100) *
                        totalBundleItemsQuantity;
                    price =
                        price -
                        price *
                            (parseFloat(extraDetails.discountValue) / 100) *
                            totalBundleItemsQuantity;
                } else {
                    totalDiscount +=
                        price * (parseFloat(extraDetails.discountValue) / 100);
                    price =
                        price -
                        price * (parseFloat(extraDetails.discountValue) / 100);
                }
            } else {
                if (extraDetails.appliesOnEachItem) {
                    // if discount in each item
                    totalDiscount +=
                        parseFloat(extraDetails.discountValue) *
                        totalBundleItemsQuantity;
                    price =
                        price -
                        parseFloat(extraDetails.discountValue) *
                            totalBundleItemsQuantity;
                } else {
                    totalDiscount += parseFloat(extraDetails.discountValue);
                    price = price - parseFloat(extraDetails.discountValue);
                }
            }
        }

        bundleItem.price = `${extraDetails.currencySymbol}${parseFloat(
            price
        ).toFixed(2)}`;

        if (extraDetails?.productsQuantity) {
            bundleItems[i]["bundleProductQuantity"] =
                extraDetails.productsQuantity;
            bundleItems[i]["eachBundleAmount"] = `${
                extraDetails.currencySymbol
            }${parseFloat(
                bundleItems[i].final_line_price / extraDetails.productsQuantity
            ).toFixed(2)}`;
        } else {
            bundleItems[i]["bundleProductQuantity"] = 1;
            bundleItems[i]["eachBundleAmount"] = `${
                extraDetails.currencySymbol
            }${parseFloat(price / 1).toFixed(2)}`;
        }
        if (quantityMapping.length) {
            bundleItem.bundleQuantityMapping = quantityMapping;
        }
        if (isPresetBundleProduct) {
            bundleItem.productHandle = extraDetails.product_handle;
        }
    }

    removeDiscountFromSubtotalInCartLoop(
        totalDiscount,
        currencySymbol,
        currency
    );
};

const removeDiscountFromSubtotalInCartLoop = (
    totalDiscount,
    currencySymbol,
    currency
) => {
    let targetNode = null;
    targetNode = document.querySelector(`#CartDrawer-Total`);
    if (targetNode) {
        applyDiscountByCartLineItemsLoop(
            targetNode,
            totalDiscount,
            currencySymbol,
            currency
        );
    }
};

function applyDiscountByCartLineItemsLoop(
    element,
    discount,
    currencySymbol,
    currency
) {
    const totalLineItemsPrice = window?.Loop?.bundleCartAllItems?.reduce(
        (acc, item) => {
            return (
                acc +
                (item.properties._isPresetBundleProduct
                    ? item.discounted_price
                    : item.price) *
                    item.quantity
            );
        },
        0
    );
    const discountedPrice = (
        (totalLineItemsPrice / 100).toFixed(2) - discount
    ).toFixed(2);

    if (!isNaN(discountedPrice)) {
        element.innerHTML = `${currencySymbol ?? ""}${discountedPrice} ${
            currency ?? ""
        }`;
    }
}

const getBundleItemsLoop = (items) => {
    const bundleItemsMap = {};
    for (const item of items) {
        const bundleId =
            item?.properties?._bundleId ?? item?.properties?.bundleId;
        if (!bundleId) continue;
        if (!Object.hasOwn(bundleItemsMap, bundleId)) {
            bundleItemsMap[bundleId] = {
                bundleId,
                quantity: 1,
                price: (Number(item.price) * Number(item.quantity)) / 100,
                amount: (Number(item.price) * Number(item.quantity)) / 100,
                items: [item],
                discounted_price:
                    (Number(item.discounted_price) * Number(item.quantity)) /
                    100,
                isPresetBundleProduct: item?.properties?._isPresetBundleProduct,
                discountTitle: item?.discounts?.[0]?.title ?? "",
                final_line_price: Number(item.final_line_price) / 100,
            };
        } else {
            bundleItemsMap[bundleId].price +=
                (Number(item.price) * Number(item.quantity)) / 100;
            bundleItemsMap[bundleId].discounted_price +=
                (Number(item.discounted_price) * Number(item.quantity)) / 100;
            bundleItemsMap[bundleId].amount +=
                (Number(item.price) * Number(item.quantity)) / 100;
            bundleItemsMap[bundleId].final_line_price +=
                Number(item.final_line_price) / 100;
            bundleItemsMap[bundleId].items.push(item);
        }
    }
    return sortItemsByTitleLoop(Object.values(bundleItemsMap));
};

const sortItemsByTitleLoop = (bundles) => {
    return bundles.map((bundle) => {
        bundle.items.sort((a, b) => {
            let titleA = a.title.toUpperCase();
            let titleB = b.title.toUpperCase();
            if (titleA < titleB) {
                return -1;
            }
            if (titleA > titleB) {
                return 1;
            }
            return 0;
        });
        return bundle;
    });
};

const renderBundleItemsLoop = (bundleItems, clientId) => {
    let _parent = document.querySelector(`.${clientId}`);
    if (!_parent) {
        _parent = document.querySelector(`.${BUNDLE_CONTAINER_CLASS}`);
    }
  // console.log(_parent)
    if (!_parent) {
        return;
    }
// console.log("FAf")
    for (let i = 0; i < bundleItems.length; ++i) {
        let bundleItem = bundleItems[i];
        const _bundleLink = bundleItem.isPresetBundleProduct
            ? `https://${window.Shopify.shop}/products/${bundleItem.productHandle}`
            : `${BUNDLE_LINK_PREFIX}/${bundleItem.loopBundleId}`;
        let _template = undefined;
        let hasTable = document.getElementsByTagName("table");

        if (
            bundleItem["isPresetBundleProduct"] &&
            window.location.pathname === "/cart"
        ) {
            _template = getPresetBundleCartTemplateLoop(
                bundleItem,
                i + 1,
                _bundleLink
            );
        } else if (
            bundleItem["isPresetBundleProduct"] &&
            window.location.pathname !== "/cart"
        ) {
            _template = getPresetBundleCartDrawerTemplateLoop(
                bundleItem,
                i + 1,
                _bundleLink
            );
        } else if (clientId.includes("drawer") && hasTable.length) {
            _template = getBundleCartDrawerTemplateLoop(
                bundleItem,
                i + 1,
                _bundleLink
            );
        } else if (hasTable.length) {
            _template = getBundleCartTableTemplateLoop(
                bundleItem,
                i + 1,
                _bundleLink
            );
        } else {
            _template = getBundleCartItemsDivTemplateLoop(
                bundleItem,
                i + 1,
                _bundleLink
            );
        }
        _parent.innerHTML = `${_template} ${_parent.innerHTML}`;
    }
};

async function getCartItemsLoop() {
    const url = `https://${Shopify.cdnHost.split("/cdn")[0]}/cart.json`;
    const res = await (await fetch(url)).json();
    return res?.items ?? [];
}

function setupMutationLoop() {
    if (window.location.pathname.includes("/a/loop_subscriptions/bundle")) {
        return;
    }

    let previousQuantity = window.Loop.bundleCartAllItems.reduce(
        (acc, curr) => acc + curr.quantity,
        0
    );
    let timeoutId;
    const handleChanges = async () => {
        const res = await getCartItemsLoop();
        let currenctQuantity = res.reduce(
            (acc, curr) => acc + curr.quantity,
            0
        );
        if (currenctQuantity !== previousQuantity) {
            window.location.reload();
        }
    };

    let targetNodes = document.querySelectorAll("form");
    const config = { childList: true, subtree: true };

    targetNodes.forEach((targetNode) => {
        const observer = new MutationObserver(() => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleChanges, 500);
        });
        observer.observe(targetNode, config);
    });
}

function setupMutationIfElementDelete() {
    let firstChange = true;
    let timeoutId;
    const handleChanges = () => {
        if (firstChange) {
            firstChange = false;
        } else {
            if (
                !window.location.pathname.includes(
                    "/a/loop_subscriptions/bundle"
                )
            ) {
                firstChange = true;
                window.location.reload();
            }
        }
    };

    let targetNode = document.querySelector(".cart-container");
    if (!targetNode) {
        targetNode = document.querySelector(".cart__blocks");
    }
    if (!targetNode) {
        return;
    }

    const observer = new MutationObserver(() => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(handleChanges, 1000);
    });
    const config = { childList: true, subtree: true };
    observer.observe(targetNode, config);
}

function setupMutationOldLoop() {
    var firstChange = true;
    let targetNode = null;
    let observerNode = null;
    targetNode = document.querySelectorAll(`[data-cart-subtotal]`);
    if ((targetNode && targetNode.length > 1) || !targetNode.length) {
        observerNode = document.querySelector(`.${CART_SUBTOTAL_CLASS}`);
    } else {
        observerNode = targetNode[0];
    }

    if (!observerNode) {
        return;
    }

    const config = { attributes: true, childList: true, subtree: true };
    const callback = (mutationList, observer) => {
        if (firstChange) {
            firstChange = false;
            return;
        } else {
            firstChange = true;
            setTimeout(window.location.reload(), 1000);
        }
    };

    const observer = new MutationObserver(callback);
    observer.observe(observerNode, config);
}

const initLoopBundle = async (clientId) => {
    console.log(`Loop Bundle Initialized for ${clientId}`);

    try {
        let response = await fetch(
            `https://snippets.loopwork.co/bundle/${Shopify.shop}/${Shopify.theme.id}.json`
        );

        let data = (await response.json()) || {};
        // console.log("data", data);
        if (Object.keys(data).length) {
            BUNDLE_CONTAINER_CLASS = data.cartContainerClass;
            CART_SUBTOTAL_CLASS = data.cartSubtotalClass;
        }
    } catch (error) {
        console.log("Error fetching loop bundle classes");
    }

    const _cartItems = window.Loop.bundleCartAllItems;
    const _bundleItems = getBundleItemsLoop(_cartItems);
    await addExtraDetailsToBundleItemsLoop(_bundleItems);
    if (_bundleItems?.length) {
        setupMutationLoop();
        // setupMutationOldLoop();
        // setupMutationIfElementDelete();
    }
  // console.log("inside")
    renderBundleItemsLoop(_bundleItems, clientId);
};
