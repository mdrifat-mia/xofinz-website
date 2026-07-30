/* =====================================================
   XOFINZ — CUSTOM JAVASCRIPT
   Handles mobile navigation, scroll effects, active link
   highlighting, and contact form validation + submission
   to Formspree. No external libraries — plain modern
   JavaScript (ES6). Every feature is wrapped in a defensive
   check so a missing element on the page never throws an
   error or breaks the rest of the script.
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* -----------------------------------------------------
     1. ELEMENT REFERENCES
     Grab all the elements we'll need once, up front.
     ----------------------------------------------------- */
  const navbar = document.getElementById("navbar");
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const iconOpen = document.getElementById("icon-open");
  const iconClose = document.getElementById("icon-close");

  const navLinks = document.querySelectorAll(".nav-link");
  const mobileNavLinks = document.querySelectorAll(".mobile-nav-link");
  const sections = document.querySelectorAll("main section[id]");

  const contactForm = document.getElementById("contact-form");
  const formFeedback = document.getElementById("form-feedback");
  const submitButton = document.getElementById("submit-button");

  const yearSpan = document.getElementById("year");


  /* -----------------------------------------------------
     2. FOOTER YEAR
     Automatically keep the copyright year up to date.
     ----------------------------------------------------- */
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }


  /* -----------------------------------------------------
     3. MOBILE NAVIGATION TOGGLE
     Shows/hides the mobile menu and swaps the
     hamburger icon for a close (X) icon.
     ----------------------------------------------------- */
  const toggleMobileMenu = () => {
    mobileMenu.classList.toggle("hidden");
    iconOpen.classList.toggle("hidden");
    iconClose.classList.toggle("hidden");
    // Lock/unlock background scrolling while the mobile menu is open
    document.body.classList.toggle("overflow-hidden");
  };

  // Only wire up the toggle if every element it touches actually exists,
  // so a missing button or icon somewhere else can't break this feature.
  if (menuToggle && mobileMenu && iconOpen && iconClose) {
    menuToggle.addEventListener("click", toggleMobileMenu);

    // Close the mobile menu automatically when a link is tapped,
    // so the user isn't left staring at the menu after navigating.
    mobileNavLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (!mobileMenu.classList.contains("hidden")) {
          toggleMobileMenu();
        }
      });
    });
  }


  /* -----------------------------------------------------
     4. STICKY NAVBAR SHADOW ON SCROLL
     Adds a subtle shadow once the user scrolls down,
     so the navbar feels "lifted" above the page content.
     ----------------------------------------------------- */
  const handleNavbarShadow = () => {
    if (!navbar) return;

    if (window.scrollY > 10) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  };

  if (navbar) {
    window.addEventListener("scroll", handleNavbarShadow);
    handleNavbarShadow(); // Run once on load in case the page starts scrolled
  }


  /* -----------------------------------------------------
     5. ACTIVE NAVIGATION LINK HIGHLIGHTING
     Uses IntersectionObserver to detect which section is
     currently in view and highlights the matching nav link.
     This is more efficient than checking scroll position
     manually on every scroll event.
     ----------------------------------------------------- */
  const highlightActiveLink = (activeId) => {
    // Remove the "active" state from every link first
    navLinks.forEach((link) => link.classList.remove("nav-link-active"));
    mobileNavLinks.forEach((link) => link.classList.remove("mobile-nav-link-active"));

    // Then add it back only to the link matching the visible section
    const activeDesktopLink = document.querySelector(
      `.nav-link[href="#${activeId}"]`
    );
    const activeMobileLink = document.querySelector(
      `.mobile-nav-link[href="#${activeId}"]`
    );

    if (activeDesktopLink) activeDesktopLink.classList.add("nav-link-active");
    if (activeMobileLink) activeMobileLink.classList.add("mobile-nav-link-active");
  };

  // Only set up the observer if there are actually sections to watch,
  // so this feature fails quietly instead of throwing an error.
  if (sections.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            highlightActiveLink(entry.target.id);
          }
        });
      },
      {
        // Triggers when a section is roughly in the middle of the viewport,
        // which feels more natural than triggering at the very top/bottom.
        rootMargin: "-40% 0px -55% 0px",
        threshold: 0,
      }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }


  /* -----------------------------------------------------
     6. CONTACT FORM VALIDATION + FORMSPREE SUBMISSION
     Validates the form in the browser first, then sends it
     to Formspree using fetch() so the page never reloads and
     we can show our own success/error message.
     ----------------------------------------------------- */
  if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
      // Stop the browser's default full-page form submission —
      // we send the data with fetch() instead.
      event.preventDefault();

      const nameField = document.getElementById("name");
      const emailField = document.getElementById("email");
      const messageField = document.getElementById("message");

      // Bail out quietly if any expected field is missing from the page.
      if (!nameField || !emailField || !messageField) return;

      // Use the browser's native validation first (checks "required"
      // fields and valid email format automatically).
      if (!contactForm.checkValidity()) {
        // reportValidity() shows the browser's built-in tooltip
        // pointing to whichever field needs attention.
        contactForm.reportValidity();
        return;
      }

      // Extra check: make sure fields aren't just whitespace.
      const isNameEmpty = nameField.value.trim().length === 0;
      const isEmailEmpty = emailField.value.trim().length === 0;
      const isMessageEmpty = messageField.value.trim().length === 0;

      if (isNameEmpty || isEmailEmpty || isMessageEmpty) {
        showFeedback("Please fill in every field before submitting.", false);
        return;
      }

      // Show a temporary loading state on the button so the user
      // knows their click registered while we wait for a response.
      const originalButtonText = submitButton ? submitButton.textContent : "";
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
      }

      try {
        const formData = new FormData(contactForm);

        const response = await fetch(contactForm.action, {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        });

        if (response.ok) {
          // Formspree accepted the submission.
          showFeedback(
            `Thank you, ${nameField.value.trim()}! Your message has been received successfully. We'll get back to you within one business day.`,
            true
          );
          contactForm.reset();
        } else {
          // Formspree reached, but rejected the submission
          // (e.g. validation error on their end).
          showFeedback(
            "Something went wrong sending your message. Please try again.",
            false
          );
        }
      } catch (error) {
        // Network error — Formspree couldn't be reached at all.
        console.error(error);
        showFeedback(
          "We couldn't send your message. Please check your connection and try again.",
          false
        );
      } finally {
        // Always restore the button, whether the request succeeded or failed.
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      }
    });
  }

  /**
   * Displays a message below the contact form.
   * @param {string} message - The text to display.
   * @param {boolean} isSuccess - Whether this is a success or error message.
   */
  function showFeedback(message, isSuccess) {
    // Guard against a missing feedback element so this never throws.
    if (!formFeedback) return;

    formFeedback.textContent = message;
    formFeedback.classList.remove("hidden");

    // Use the dedicated success/error classes defined in style.css
    formFeedback.classList.remove("success", "error");
    formFeedback.classList.add(isSuccess ? "success" : "error");
  }

});
