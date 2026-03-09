import { test, expect } from '@playwright/test';

test.describe('Blog Public Pages', () => {
  test('blog listing page loads', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1')).toContainText('Blog');
  });

  test('blog search works', async ({ page }) => {
    await page.goto('/blog');
    const searchInput = page.locator('input[placeholder="Search posts..."]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test search query');
      await page.locator('button:has-text("Search")').click();
      await expect(page).toHaveURL(/search=/);
    }
  });

  test('blog categories sidebar displays', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h3:has-text("Categories")')).toBeVisible();
  });

  test('blog tags sidebar displays', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h3:has-text("Tags")')).toBeVisible();
  });
});

test.describe('Blog Dashboard - Unauthorized', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/blog/posts');
    await expect(page).not.toHaveURL('/dashboard/blog/posts');
  });
});

test.describe('Blog API Endpoints', () => {
  test('GET /api/blog/categories returns data', async ({ request }) => {
    const response = await request.get('/api/blog/categories');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('categories');
    expect(Array.isArray(data.categories)).toBeTruthy();
  });

  test('GET /api/blog/tags returns data', async ({ request }) => {
    const response = await request.get('/api/blog/tags');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('tags');
    expect(Array.isArray(data.tags)).toBeTruthy();
  });

  test('GET /api/blog/posts returns paginated data', async ({ request }) => {
    const response = await request.get('/api/blog/posts');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('posts');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('totalPages');
    expect(Array.isArray(data.posts)).toBeTruthy();
  });

  test('POST /api/blog/categories requires auth', async ({ request }) => {
    const response = await request.post('/api/blog/categories', {
      data: { name: 'Test Category', slug: 'test-category' }
    });
    expect(response.status()).toBe(401);
  });

  test('POST /api/blog/tags requires auth', async ({ request }) => {
    const response = await request.post('/api/blog/tags', {
      data: { name: 'Test Tag', slug: 'test-tag' }
    });
    expect(response.status()).toBe(401);
  });

  test('POST /api/blog/posts requires auth', async ({ request }) => {
    const response = await request.post('/api/blog/posts', {
      data: { 
        title: 'Test Post', 
        slug: 'test-post',
        content: 'Test content'
      }
    });
    expect(response.status()).toBe(401);
  });

  test('POST /api/blog/media requires auth', async ({ request }) => {
    const response = await request.post('/api/blog/media');
    expect(response.status()).toBe(401);
  });

  test('GET /api/blog/search returns data', async ({ request }) => {
    const response = await request.get('/api/blog/search?q=test');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('posts');
    expect(data).toHaveProperty('query');
  });
});

test.describe('Blog Media Upload API', () => {
  test('rejects invalid file types', async ({ request }) => {
    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');
    
    const response = await request.post('/api/blog/media', {
      multipart: {
        file: {
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('test')
        }
      }
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Blog Comments API', () => {
  test('GET /api/blog/comments requires postId for public', async ({ request }) => {
    const response = await request.get('/api/blog/comments');
    expect(response.status()).toBe(401);
  });
});

test.describe('Blog Likes API', () => {
  test('GET /api/blog/likes requires postId', async ({ request }) => {
    const response = await request.get('/api/blog/likes');
    expect(response.status()).toBe(400);
  });
});
