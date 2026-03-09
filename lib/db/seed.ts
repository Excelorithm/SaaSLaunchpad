import { db } from './drizzle';
import { blogCategories, blogTags, blogAuthors, blogPosts, blogPostCategories, blogPostTags, users } from './schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  try {
    const { stripe } = await import('../payments/stripe');
    
    const baseProduct = await stripe.products.create({
      name: 'Base',
      description: 'Base subscription plan',
    });

    await stripe.prices.create({
      product: baseProduct.id,
      unit_amount: 800,
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 7,
      },
    });

    const plusProduct = await stripe.products.create({
      name: 'Plus',
      description: 'Plus subscription plan',
    });

    await stripe.prices.create({
      product: plusProduct.id,
      unit_amount: 1200,
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 7,
      },
    });

    console.log('Stripe products and prices created successfully.');
  } catch (error) {
    console.log('Skipping Stripe products (Stripe not configured)');
  }
}

async function createBlogCategories() {
  console.log('Creating blog categories...');

  const categories = [
    {
      name: 'Technology',
      slug: 'technology',
      description: 'Posts about technology and software development',
    },
    {
      name: 'Tutorials',
      slug: 'tutorials',
      description: 'Step-by-step guides and tutorials',
    },
    {
      name: 'Product Updates',
      slug: 'product-updates',
      description: 'Latest updates and announcements about our product',
    },
    {
      name: 'Best Practices',
      slug: 'best-practices',
      description: 'Industry best practices and recommendations',
    },
  ];

  for (const category of categories) {
    await db.insert(blogCategories).values(category).onConflictDoNothing();
  }

  console.log('Blog categories created successfully.');
}

async function createBlogTags() {
  console.log('Creating blog tags...');

  const tags = [
    { name: 'Next.js', slug: 'nextjs' },
    { name: 'React', slug: 'react' },
    { name: 'TypeScript', slug: 'typescript' },
    { name: 'SaaS', slug: 'saas' },
    { name: 'Performance', slug: 'performance' },
    { name: 'Security', slug: 'security' },
  ];

  for (const tag of tags) {
    await db.insert(blogTags).values(tag).onConflictDoNothing();
  }

  console.log('Blog tags created successfully.');
}

async function createBlogAuthor() {
  console.log('Creating blog author...');

  const adminEmail = 'admin@saaslaunchpad.com';
  const adminPassword = 'admin123';
  const passwordHash = crypto.createHash('sha256').update(adminPassword).digest('hex');

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  let userId: string;

  if (!existingUser) {
    const [newUser] = await db
      .insert(users)
      .values({
        name: 'Admin User',
        email: adminEmail,
        role: 'owner',
      })
      .returning();
    userId = newUser.id;

    await db.insert(blogAuthors).values({
      userId,
      bio: 'Admin user and content creator for SaaSLaunchpad.',
    });

    const { accounts } = await import('./schema');
    await db.insert(accounts).values({
      userId: userId,
      type: 'oauth' as any,
      provider: 'credentials',
      providerAccountId: adminEmail,
      access_token: passwordHash,
    } as any);
  } else {
    userId = existingUser.id;

    const [existingAuthor] = await db
      .select()
      .from(blogAuthors)
      .where(eq(blogAuthors.userId, userId))
      .limit(1);

    if (!existingAuthor) {
      await db.insert(blogAuthors).values({
        userId,
        bio: 'Admin user and content creator for SaaSLaunchpad.',
      });
    }
  }

  console.log('Blog author created successfully.');
  return userId;
}

async function createBlogPosts(authorUserId: string) {
  console.log('Creating blog posts...');

  const [author] = await db
    .select()
    .from(blogAuthors)
    .where(eq(blogAuthors.userId, authorUserId))
    .limit(1);

  if (!author) {
    console.log('Author not found, skipping blog posts creation.');
    return;
  }

  const [techCategory] = await db
    .select()
    .from(blogCategories)
    .where(eq(blogCategories.slug, 'technology'))
    .limit(1);

  const [tutorialsCategory] = await db
    .select()
    .from(blogCategories)
    .where(eq(blogCategories.slug, 'tutorials'))
    .limit(1);

  const [nextjsTag] = await db
    .select()
    .from(blogTags)
    .where(eq(blogTags.slug, 'nextjs'))
    .limit(1);

  const [reactTag] = await db
    .select()
    .from(blogTags)
    .where(eq(blogTags.slug, 'react'))
    .limit(1);

  const [saasTag] = await db
    .select()
    .from(blogTags)
    .where(eq(blogTags.slug, 'saas'))
    .limit(1);

  const posts = [
    {
      title: 'Getting Started with Next.js 15',
      slug: 'getting-started-with-nextjs-15',
      excerpt: 'Learn how to get started with Next.js 15, the latest version of the popular React framework with improved performance and new features.',
      content: `<p>Next.js 15 is the latest version of the popular React framework. It brings exciting new features and improvements that make building web applications faster and more efficient.</p>
<h2>What's New in Next.js 15?</h2>
<p>Next.js 15 introduces several groundbreaking features:</p>
<ul>
<li><strong>Improved Server Components</strong>: Better performance and developer experience</li>
<li><strong>Enhanced Caching</strong>: More control over caching strategies</li>
<li><strong>Turbopack</strong>: Faster development builds</li>
<li><strong>Partial Prerendering</strong>: Mix static and dynamic content seamlessly</li>
</ul>
<h2>Getting Started</h2>
<p>To create a new Next.js 15 project, run:</p>
<pre><code>npx create-next-app@latest my-app</code></pre>
<p>This will set up a new project with all the latest features and best practices built-in.</p>
<h2>Key Features</h2>
<h3>Server Components by Default</h3>
<p>Next.js 15 makes server components the default, improving performance by reducing the amount of JavaScript sent to the client.</p>
<h3>Better Developer Experience</h3>
<p>With improved error messages, better TypeScript support, and faster hot reloading, development is smoother than ever.</p>
<p>Start building with Next.js 15 today and experience the future of web development!</p>`,
      authorId: author.id,
      status: 'published',
      visibility: 'public',
      publishedAt: new Date(),
      readingTime: 5,
      categoryId: techCategory?.id,
      tagIds: [nextjsTag?.id, reactTag?.id].filter(Boolean) as number[],
    },
    {
      title: 'Building a SaaS Application with Next.js',
      slug: 'building-saas-application-nextjs',
      excerpt: 'A comprehensive guide to building a modern SaaS application using Next.js, covering authentication, payments, and more.',
      content: `<p>Building a Software as a Service (SaaS) application requires careful planning and the right tools. Next.js provides an excellent foundation for building modern SaaS applications.</p>
<h2>Essential Features for SaaS</h2>
<p>Every SaaS application needs:</p>
<ol>
<li><strong>Authentication</strong>: Secure user login and registration</li>
<li><strong>Payments</strong>: Subscription management with Stripe</li>
<li><strong>Database</strong>: Reliable data storage with Postgres</li>
<li><strong>Email</strong>: Transactional emails and notifications</li>
</ol>
<h2>Architecture Overview</h2>
<p>A typical SaaS architecture includes:</p>
<ul>
<li>Frontend: Next.js with React</li>
<li>Backend: Next.js API routes or server actions</li>
<li>Database: PostgreSQL with Drizzle ORM</li>
<li>Payments: Stripe integration</li>
<li>Authentication: NextAuth.js</li>
</ul>
<h2>Getting Started</h2>
<p>Start by setting up your development environment and installing the necessary dependencies. Use our SaaS Launchpad template to get up and running quickly!</p>
<p>Building a SaaS has never been easier with modern tools and frameworks.</p>`,
      authorId: author.id,
      status: 'published',
      visibility: 'public',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      readingTime: 7,
      categoryId: tutorialsCategory?.id,
      tagIds: [nextjsTag?.id, saasTag?.id].filter(Boolean) as number[],
    },
    {
      title: '10 Tips for Better React Performance',
      slug: '10-tips-better-react-performance',
      excerpt: 'Improve your React application performance with these proven optimization techniques and best practices.',
      content: `<p>React performance optimization is crucial for delivering a great user experience. Here are 10 tips to make your React applications faster:</p>
<h2>1. Use React.memo Wisely</h2>
<p>Memoize components that receive the same props frequently to prevent unnecessary re-renders.</p>
<h2>2. Implement Code Splitting</h2>
<p>Use dynamic imports to split your code and load only what's needed:</p>
<pre><code>const Component = dynamic(() => import('./Component'));</code></pre>
<h2>3. Optimize Images</h2>
<p>Use Next.js Image component for automatic optimization and lazy loading.</p>
<h2>4. Virtualize Long Lists</h2>
<p>For long lists, use virtualization to render only visible items.</p>
<h2>5. Avoid Inline Functions</h2>
<p>Define functions outside render to prevent recreation on each render.</p>
<h2>6. Use useCallback and useMemo</h2>
<p>Memoize functions and values to prevent unnecessary computations.</p>
<h2>7. Lazy Load Components</h2>
<p>Load heavy components only when needed using React.lazy.</p>
<h2>8. Optimize Context Usage</h2>
<p>Split context to prevent unnecessary re-renders across the tree.</p>
<h2>9. Use Production Builds</h2>
<p>Always use production builds for deployment to get performance optimizations.</p>
<h2>10. Monitor Performance</h2>
<p>Use React DevTools Profiler to identify and fix performance bottlenecks.</p>
<p>Apply these tips to significantly improve your React application's performance!</p>`,
      authorId: author.id,
      status: 'published',
      visibility: 'public',
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      readingTime: 6,
      categoryId: techCategory?.id,
      tagIds: [reactTag?.id].filter(Boolean) as number[],
    },
  ];

  for (const post of posts) {
    const { categoryId, tagIds, ...postData } = post;

    const [existingPost] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, postData.slug))
      .limit(1);

    if (!existingPost) {
      const [newPost] = await db
        .insert(blogPosts)
        .values(postData)
        .returning();

      if (categoryId) {
        await db.insert(blogPostCategories).values({
          postId: newPost.id,
          categoryId,
        });
      }

      for (const tagId of tagIds) {
        await db.insert(blogPostTags).values({
          postId: newPost.id,
          tagId,
        });
      }
    }
  }

  console.log('Blog posts created successfully.');
}

async function seed() {
  try {
    await createStripeProducts();
  } catch (error) {
    console.log('Skipping Stripe products (Stripe not configured)');
  }
  await createBlogCategories();
  await createBlogTags();
  const userId = await createBlogAuthor();
  await createBlogPosts(userId);
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });