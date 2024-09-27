export const removeSpace = (text) => {
    return text.replace(/\u00a0/g, '').trim();
}

export const convertToNumber = (text) => {
    return parseFloat(text.replace(/[^\d.-]/g,''));
}

export const clickMultipleTimes = (element, selector, times) => {
    let promise = cy.wrap(element);
    
    for (let i = 0; i < times; i++) {
      promise = promise.then(() => {
        // Click the plus or minus button based on the selector
        cy.wrap(element)
          .find(selector)
          .should("be.visible")
          .click()
      });
    }
    return promise; // Return the chained promise
  };

  export const testWaitlistRooms = (index = 0) => {
    cy.get("iho-pdp-rooms-cards")
      .filter(':contains(" لیست انتظار ")')
      .then(($elements) => {
        if (index >= $elements.length) {
          cy.log('تمام موارد لیست انتظار تست شد');
          return;
        }

        // Get the current room element and wrap it for Cypress chaining
        const $room = $elements.eq(index);
        cy.wrap($room)
          .contains(" لیست انتظار ")
          .click() // Click the waitlist button
          .then(() => {
            // After clicking, verify that the URL is as expected
            cy.url().then((currentUrl) => {
              expect(currentUrl).to.include('https://www.iranhotelonline.com/persian/pursuit?hotelid=');
            });

            // Go back to the previous page
            cy.go('back');

            // Wait for the page to load and verify the initial condition again
            cy.get("iho-pdp-rooms-cards").should("exist");
          })
          .then(() => {
            // Call the function again to test the next waitlist button
            testWaitlistRooms(index + 1);
          });
      });
  }