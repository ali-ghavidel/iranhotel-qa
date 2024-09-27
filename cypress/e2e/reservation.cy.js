import { convertToNumber, removeSpace, clickMultipleTimes, testWaitlistRooms } from "./pubFuncs";
var url = "";
var total = 0;
var count = 0;

describe('بررسی فرآیند رزرو',()=>{
describe("صفحه اصلی سایت", () => {
  it("باید به صفحه اصلی سایت وارد شود", () => {
    cy.visit("https://www.iranhotelonline.com/"); // آدرس صفحه‌ای که می‌خواهید بازدید کنید
    cy.title().should(
      "include",
      "رزرو هتل با قیمت ارزان و پشتیبانی 24 ساعته از ایران هتل آنلاین"
    ); // بررسی عنوان صفحه
  });
});
describe("رفتن به صفحه هتل های مشهد", () => {
  it("باید با انتخاب هتل های مشهد به صفحه مورد نظر برود", () => {
    cy.visit("https://www.iranhotelonline.com/");
    cy.get('a[href="/mashhad-hotels/"]').then((link) => {
      const url = link.prop("href");
      cy.visit(url); // بازدید از لینک
      cy.title().should("include", "هتل های مشهد - رزرو هتل مشهد تا 91% تخفیف");
    });
  });
});

describe("انتخاب یک هتل", () => {
  let title = "";
  let hotelName = "";
  it("به صورت تصادفی یک هتل را انتخاب میکنیم", () => {
    cy.visit("https://www.iranhotelonline.com/mashhad-hotels/");

    // Select the second hotel card and extract the hotel name
    cy.get("iho-plp-card")
      .children()
      .eq(Math.floor(Math.random() * 10))
      .within(() => {
        cy.get("h2")
          .invoke("text")
          .then((text) => {
            // Remove spaces and update `hotelName`
            hotelName = removeSpace(text);
          });

        // Click the button to navigate to the reservation page
        cy.get("button").contains("انتخاب اتاق و رزرو").click();
      })
      .then(() => {
        cy.get("h1")
          .invoke("text")
          .then((text) => {
            title = removeSpace(text);
            expect(title).to.include(hotelName);
          });
        cy.url().then((currentUrl) => {
          url = currentUrl;
        });
      });
  });
});
describe("انتخاب اتاق در هتل", () => {
  it("با کلیک روی اتاق ها باید صفحه به بخش نمایش اتاق ها جابجا شود", () => {
    cy.visit(url);
    // Check and click the "Rooms" button
    cy.get("button.rooms").click();

    // Verify that the Rooms section is visible
    cy.get("h2").contains("انتخاب اتاق").should("be.visible");
  });

  it("باید اتاق هایی که ظرفیت بیش از یک دارند امکان اضافه و کم کردن داشته باشند و تعداد اتاق ها و مبلغ در سبد خرید با حاصلجمع یکسان باشد", () => {
    cy.visit(url);
    cy.get("iho-pdp-rooms-cards").then(($element) => {
      if ($element.find('*:contains(" انتخاب اتاق ")').length > 0 && $element.find('*:contains("آخرین اتاق باقیمانده")').length === 0) {
        cy.get("iho-pdp-rooms-cards")
          .not(':contains("آخرین اتاق باقیمانده")')
          .not(':contains(" لیست انتظار ")')
          .each(($el) => {
            // Select a room and add it to the cart
            const randomPlusClick = Math.floor(Math.random() * 10); // Random number of plus clicks
            const randomMinusClick = Math.min(
              randomPlusClick,
              Math.floor(Math.random() * 3)
            );

            cy.wrap($el)
              .contains(" انتخاب اتاق ")
              .click()
              .then(() => {
                count++;
                cy.get("iho-pdp-mobile-affix").should("be.visible");
                cy.get("iho-pdp-mobile-affix")
                  .contains("اتاق های انتخابی")
                  .should("include.text", count.toString());
              });

            // Get and update the initial amount
            cy.wrap($el)
              .contains("1 شب")
              .parent()
              .children()
              .eq(1)
              .invoke("text")
              .then((text) => {
                const amount = convertToNumber(text);
                total += amount;
              });

            // Click the plus button multiple times based on randomPlusClick value
            clickMultipleTimes($el, ".plus", randomPlusClick).then(
              () => {
                // After plus clicks, update the amount again
                count += randomPlusClick;
                cy.wrap($el)
                  .contains("1 شب")
                  .parent()
                  .children()
                  .eq(1)
                  .invoke("text")
                  .then((text) => {
                    const amount = convertToNumber(text) * randomPlusClick;
                    total += amount;
                  });
              }
            );

            // Click the minus button multiple times based on randomMinusClick value
            clickMultipleTimes(
              $el,
              ".minus",
              randomMinusClick,
            ).then(() => {
              // After minus clicks, update the amount again
              count -= randomMinusClick;
              cy.wrap($el)
                .contains("1 شب")
                .parent()
                .children()
                .eq(1)
                .invoke("text")
                .then((text) => {
                  const amount = convertToNumber(text) * randomMinusClick;
                  total -= amount;
                });
            });
          })
          .then(() => {
            // After all operations, verify the total amount
            cy.log(`Total Amount: ${total}`); // Log the total amount after loop completion
            cy.log(`count: ${count}`);
            cy.get("iho-pdp-mobile-affix")
              .contains("مبلغ قابل پرداخت")
              .parent()
              .children()
              .eq(1)
              .children()
              .eq(0)
              .invoke("text")
              .then((text) => {
                const result = convertToNumber(text);
                expect(total).to.equal(result);
              });
          });
      } else {
        cy.log("اتاقی با ظرفیت بیش از یک یافت نشد");
      }
    });
  });

  it("اگر آخرین اتاق باشد باید افزودن بیش از یک اتاق غیرفعال باشد", () => {
    cy.visit(url);
    cy.get("iho-pdp-rooms-cards").then(($element) => {
      if ($element.find('*:contains("آخرین اتاق باقیمانده")').length > 0) {
        cy.get("iho-pdp-rooms-cards")
          .filter(':contains("آخرین اتاق باقیمانده")')
          .each(($el) => {
            // Select a room and add it to the cart
            cy.wrap($el)
              .contains(" انتخاب اتاق ")
              .click()
              .then(() => {
                cy.wrap($el)
                  .find(".plus > button")
                  .should("have.class", "disabled");
              });
          });
      } else {
        cy.log("هیچ اتاقی با ظرفیت یک عدد یافت نشد");
      }
    });
  });

  it("اگر تعداد رزرو یک اتاق به صفر برسد سبد خرید نباید نشان داده شود", () => {
    cy.visit(url);
    cy.get("iho-pdp-rooms-cards").then(($element) => {
      if (
        $element.find('*:contains("آخرین اتاق باقیمانده")').length > 0 ||
        $element.find('*:contains(" انتخاب اتاق ")').length > 0
      ) {
        cy.get("iho-pdp-rooms-cards")
          .not(':contains(" لیست انتظار ")')
          .each(($el) => {
            cy.wrap($el)
              .contains(" انتخاب اتاق ")
              .click()
              .then(() => {
                cy.get("iho-pdp-mobile-affix").should("be.visible");
                cy.get("iho-pdp-mobile-affix")
                  .contains("اتاق های انتخابی")
                  .should("include.text", (1).toString());

                cy.wrap($el)
                  .find(".minus")
                  .should("be.visible")
                  .click()
                  .then(() => {
                    cy.get("iho-pdp-mobile-affix").should("not.be.visible");
                  });
              });
          });
      } else {
        cy.log("اتاقی برای رزرو وجود ندارد");
      }
    });
  });
  it('باید در صورت انتخاب لیست انتظار به صفحه ثبت فرم انتظار برود', () => {
  cy.visit(url);

  cy.get("iho-pdp-rooms-cards").then(($element) => {
    if ($element.find('*:contains(" لیست انتظار ")').length > 0) {
      testWaitlistRooms(0);
    } else {
      cy.log('اتاقی با شرایط لیست انتظار وجود ندارد');
    }
  });
});
});
})