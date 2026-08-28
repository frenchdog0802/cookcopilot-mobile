import { constrainUnsplashUrl } from '../../utils/imageUrl';

describe('constrainUnsplashUrl', () => {
  it('rewrites Unsplash width param', () => {
    const input =
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=80';
    const result = constrainUnsplashUrl(input, 800);
    expect(result).toContain('w=800');
    expect(result).toContain('auto=format');
  });

  it('passes through non-Unsplash URLs', () => {
    const input = 'https://cdn.example.com/recipe.jpg?w=2000';
    expect(constrainUnsplashUrl(input, 800)).toBe(input);
  });

  it('returns empty uri unchanged', () => {
    expect(constrainUnsplashUrl('', 800)).toBe('');
  });
});
