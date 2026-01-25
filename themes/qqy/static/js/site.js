(function () {
  var body = document.body;
  var btnMode = document.querySelector('.btn-read-mode');
  var searchForm = document.getElementById('search');
  var exploreLink = document.querySelector('.explore-link');
  var goTop = document.querySelector('.fixed-btn');

  function setMode(mode) {
    if (mode === 'night') {
      body.classList.add('night-mode');
      btnMode.dataset.mode = 'night';
      btnMode.querySelector('.mode-sun').style.display = 'none';
      btnMode.querySelector('.mode-moon').style.display = 'inline-flex';
    } else {
      body.classList.remove('night-mode');
      btnMode.dataset.mode = 'day';
      btnMode.querySelector('.mode-sun').style.display = 'inline-flex';
      btnMode.querySelector('.mode-moon').style.display = 'none';
    }
    localStorage.setItem('mode', mode);
  }

  if (btnMode) {
    var saved = localStorage.getItem('mode') || 'day';
    setMode(saved);
    btnMode.addEventListener('click', function () {
      var next = btnMode.dataset.mode === 'night' ? 'day' : 'night';
      setMode(next);
    });
  }

  if (searchForm) {
    var input = searchForm.querySelector('input');
    if (input) {
      input.setAttribute('inputmode', 'search');
    }
  }

  if (exploreLink) {
    exploreLink.addEventListener('click', function (e) {
      e.preventDefault();
      var posts = Array.prototype.slice.call(document.querySelectorAll('.post-title'));
      if (!posts.length) return;
      var pick = posts[Math.floor(Math.random() * posts.length)];
      if (pick && pick.getAttribute('href')) {
        window.location.href = pick.getAttribute('href');
      }
    });
  }

  function toggleGoTop() {
    if (!goTop) return;
    if (window.scrollY > 360) {
      goTop.style.display = 'block';
    } else {
      goTop.style.display = 'none';
    }
  }

  window.addEventListener('scroll', toggleGoTop);
  toggleGoTop();
})();
