import { describe, it, expect, beforeEach } from 'vitest';
import { useCart } from '../cartStore';

describe('Cart Store', () => {
  beforeEach(() => {
    useCart.getState().clear();
  });

  it('starts with empty items', () => {
    expect(useCart.getState().items).toEqual([]);
    expect(useCart.getState().total()).toBe(0);
    expect(useCart.getState().itemCount()).toBe(0);
  });

  it('adds item', () => {
    const { addItem } = useCart.getState();
    addItem({ productId: '1', slug: 'a', title: 'A', priceCents: 1000 });
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0]).toMatchObject({
      productId: '1',
      slug: 'a',
      title: 'A',
      priceCents: 1000,
      quantity: 1,
    });
  });

  it('increments quantity when adding existing item', () => {
    const { addItem } = useCart.getState();
    addItem({ productId: '1', slug: 'a', title: 'A', priceCents: 1000 });
    addItem({ productId: '1', slug: 'a', title: 'A', priceCents: 1000 });
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].quantity).toBe(2);
  });

  it('adds item with custom quantity', () => {
    const { addItem } = useCart.getState();
    addItem({ productId: '1', slug: 'a', title: 'A', priceCents: 1000 }, 3);
    expect(useCart.getState().items[0].quantity).toBe(3);
  });

  it('removes item', () => {
    const { addItem, removeItem } = useCart.getState();
    addItem({ productId: '1', slug: 'a', title: 'A', priceCents: 1000 });
    addItem({ productId: '2', slug: 'b', title: 'B', priceCents: 500 });
    removeItem('1');
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].productId).toBe('2');
  });

  it('updates quantity', () => {
    const { addItem, updateQuantity } = useCart.getState();
    addItem({ productId: '1', slug: 'a', title: 'A', priceCents: 1000 });
    updateQuantity('1', 5);
    expect(useCart.getState().items[0].quantity).toBe(5);
  });

  it('removes item when quantity set to 0', () => {
    const { addItem, updateQuantity } = useCart.getState();
    addItem({ productId: '1', slug: 'a', title: 'A', priceCents: 1000 });
    updateQuantity('1', 0);
    expect(useCart.getState().items).toHaveLength(0);
  });

  it('calculates total', () => {
    const { addItem, total } = useCart.getState();
    addItem({ productId: '1', slug: 'a', title: 'A', priceCents: 1000 }, 2);
    addItem({ productId: '2', slug: 'b', title: 'B', priceCents: 500 }, 3);
    expect(total()).toBe(3500);
  });

  it('counts total item quantity', () => {
    const { addItem, itemCount } = useCart.getState();
    addItem({ productId: '1', slug: 'a', title: 'A', priceCents: 1000 }, 2);
    addItem({ productId: '2', slug: 'b', title: 'B', priceCents: 500 }, 3);
    expect(itemCount()).toBe(5);
  });

  it('clears cart', () => {
    const { addItem, clear } = useCart.getState();
    addItem({ productId: '1', slug: 'a', title: 'A', priceCents: 1000 });
    addItem({ productId: '2', slug: 'b', title: 'B', priceCents: 500 });
    clear();
    expect(useCart.getState().items).toEqual([]);
    expect(useCart.getState().total()).toBe(0);
  });
});
