document.addEventListener("DOMContentLoaded", function (event) {

    const carousel = document.querySelector('#carousel3dprints');
    if (carousel) {
      let startX = 0;
      let deltaX = 0;
      const threshold = 40;

      carousel.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        deltaX = 0;
      }, { passive: true });

      carousel.addEventListener('touchmove', function (e) {
        deltaX = e.touches[0].clientX - startX;
      }, { passive: true });

      carousel.addEventListener('touchend', function () {
        if (Math.abs(deltaX) < threshold) {
          return;
        }
        if (deltaX > 0) {
          $('#carousel3dprints').carousel('prev');
        } else {
          $('#carousel3dprints').carousel('next');
        }
      });
    }
  });