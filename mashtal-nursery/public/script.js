document.addEventListener('DOMContentLoaded', () => {
  const cartCountEls = document.querySelectorAll('#cartCount');

  const updateCartCount = (count) => {
    cartCountEls.forEach(el => {
      el.textContent = count;
    });
  };

  const addButtons = document.querySelectorAll('.add-to-cart');
  addButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      const response = await fetch('/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id })
      });

      const result = await response.json();
      if (result.success) {
        updateCartCount(result.cartCount);
      }
    });
  });

  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      const cards = document.querySelectorAll('.product-card[data-category]');
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      cards.forEach(card => {
        const category = card.dataset.category;
        card.style.display = filter === 'all' || category === filter ? 'block' : 'none';
      });
    });
  });
});
