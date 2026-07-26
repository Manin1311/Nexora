"""
Management command to seed initial challenge data for Nexora.
Run: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from challenges.models import Challenge, ChallengeTopic


class Command(BaseCommand):
    help = 'Seeds initial challenge topics and challenges'

    def handle(self, *args, **options):
        topics_data = [
            {'name': 'JavaScript', 'icon': '⚡', 'color': '#f59e0b'},
            {'name': 'Python', 'icon': '🐍', 'color': '#3b82f6'},
            {'name': 'React', 'icon': '⚛️', 'color': '#06b6d4'},
            {'name': 'Django', 'icon': '🦄', 'color': '#10b981'},
            {'name': 'System Design', 'icon': '🏗️', 'color': '#8b5cf6'},
            {'name': 'Data Structures', 'icon': '🧮', 'color': '#f43f5e'},
            {'name': 'SQL', 'icon': '🗄️', 'color': '#6366f1'},
            {'name': 'Backend', 'icon': '⚙️', 'color': '#a78bfa'},
        ]

        topics = {}
        for t in topics_data:
            topic, created = ChallengeTopic.objects.get_or_create(name=t['name'], defaults={'icon': t['icon'], 'color': t['color']})
            topics[t['name']] = topic
            if created:
                self.stdout.write(f"  [+] Created topic: {t['name']}")

        challenges_data = [
            {
                'title': 'Build JWT Authentication API',
                'description': '''Design and implement a complete JWT authentication system using Django REST Framework.

Your solution should include:
- User registration endpoint with email validation
- Login endpoint returning access + refresh tokens
- Token refresh endpoint
- Protected route using JWT Bearer token
- Logout with token blacklisting

Include proper error handling and security best practices.''',
                'requirements': [
                    'POST /auth/register/ — Register with email and password',
                    'POST /auth/login/ — Returns JWT access and refresh tokens',
                    'POST /auth/token/refresh/ — Refreshes access token',
                    'GET /auth/me/ — Protected endpoint returning user data',
                    'POST /auth/logout/ — Blacklists refresh token',
                ],
                'difficulty': 'medium',
                'topic': topics['Backend'],
                'challenge_type': 'daily',
                'xp_reward': 200,
                'tags': ['jwt', 'django', 'authentication', 'rest-api'],
                'estimated_time': '45 min',
            },
            {
                'title': 'Explain JavaScript Closures',
                'description': '''JavaScript closures are one of the most powerful and often misunderstood concepts in the language.

In your answer:
1. Define what a closure is in your own words
2. Explain why closures exist (the problem they solve)
3. Provide 2-3 practical use cases (e.g., data privacy, function factories, memoization)
4. Show a code example for each use case
5. Explain common gotchas (e.g., loop + setTimeout classic problem)''',
                'requirements': [
                    'Clear definition of closures',
                    'Explain the lexical scoping mechanism',
                    'At least 2 practical real-world examples with code',
                    'Address the loop closure gotcha',
                    'Mention module pattern as an advanced use case',
                ],
                'difficulty': 'easy',
                'topic': topics['JavaScript'],
                'challenge_type': 'topic',
                'xp_reward': 100,
                'tags': ['javascript', 'closures', 'scope', 'concepts'],
                'estimated_time': '20 min',
            },
            {
                'title': 'Design a URL Shortener System',
                'description': '''Design a scalable URL shortener like bit.ly or TinyURL from scratch.

Your system design should cover:
- Core functionality: shorten URL, redirect to original
- Database schema and technology choices
- Hashing algorithm for generating short codes
- Handling collisions
- Scalability considerations (caching, load balancing)
- Analytics tracking (click counts, geolocation)
- Rate limiting to prevent abuse

Think through trade-offs and justify your decisions.''',
                'requirements': [
                    'Core API design (endpoints, request/response)',
                    'Database schema with reasoning',
                    'Short code generation algorithm',
                    'Caching strategy (Redis/Memcached)',
                    'Scalability to 1 billion URLs',
                    'Rate limiting approach',
                ],
                'difficulty': 'hard',
                'topic': topics['System Design'],
                'challenge_type': 'weekly',
                'xp_reward': 400,
                'tags': ['system-design', 'scalability', 'caching', 'databases'],
                'estimated_time': '60 min',
            },
            {
                'title': 'Build a React Custom Hook: useLocalStorage',
                'description': '''Create a production-ready `useLocalStorage` custom hook in React that:

1. Stores and retrieves values from localStorage
2. Syncs state across multiple components
3. Handles SSR (Next.js compatibility)
4. Handles JSON serialization/deserialization
5. Handles errors gracefully (quota exceeded, invalid JSON)
6. Supports initial value (static or lazy function)

Include TypeScript types if you can, and add usage examples.''',
                'requirements': [
                    'Hook signature: useLocalStorage(key, initialValue)',
                    'Returns [storedValue, setValue] like useState',
                    'Handles JSON.parse errors with fallback',
                    'Syncs across tabs using storage event',
                    'Works with SSR (no window access on server)',
                    'Include at least 2 usage examples',
                ],
                'difficulty': 'medium',
                'topic': topics['React'],
                'challenge_type': 'topic',
                'xp_reward': 150,
                'tags': ['react', 'hooks', 'custom-hook', 'localstorage'],
                'estimated_time': '30 min',
            },
            {
                'title': 'Write a Binary Search Implementation',
                'description': '''Implement binary search and analyze its complexity.

Your solution should include:
1. Iterative binary search implementation
2. Recursive binary search implementation
3. Handle edge cases (empty array, element not found, duplicates)
4. Time and space complexity analysis
5. Real-world use case where binary search applies beyond simple arrays

Bonus: Implement binary search on a rotated sorted array.''',
                'requirements': [
                    'Iterative implementation with correct logic',
                    'Recursive implementation',
                    'Edge case handling (empty array, out of bounds)',
                    'O(log n) time complexity explanation',
                    'At least one real-world application example',
                ],
                'difficulty': 'easy',
                'topic': topics['Data Structures'],
                'challenge_type': 'topic',
                'xp_reward': 80,
                'tags': ['algorithms', 'binary-search', 'arrays', 'complexity'],
                'estimated_time': '25 min',
            },
            {
                'title': 'Write a SQL Query to Find Employees with Top Salaries per Department',
                'description': '''Write a robust SQL query to find employees who have the highest salary in each of their respective departments.

Your solution should cover:
1. Basic JOINs between Employee and Department tables
2. Handling ties (multiple employees with the same top salary in a department)
3. Using window functions like RANK() or DENSE_RANK()
4. An alternative approach using correlated subqueries
5. Explanation of indexing choices to speed up this query on a database with millions of records''',
                'requirements': [
                    'Correct handling of department salary ranks',
                    'Includes window function or correlated subquery approach',
                    'Proper handling of salary ties',
                    'Suggestions for DB indexing on columns'
                ],
                'difficulty': 'easy',
                'topic': topics['SQL'],
                'challenge_type': 'topic',
                'xp_reward': 100,
                'tags': ['sql', 'queries', 'databases', 'window-functions'],
                'estimated_time': '20 min',
            },
            {
                'title': 'Build a Custom Decorator for Function Execution Time Profiling',
                'description': '''Create a reusable Python decorator `@profile_time` that prints the execution time of any decorated function.

Your decorator should:
1. Preserve the original function's docstring, name, and attributes (using functools.wraps)
2. Support positional and keyword arguments (`*args`, `**kwargs`)
3. Support optional config parameters to log time in milliseconds or seconds
4. Work on both standalone functions and class methods
5. Handle exceptions thrown by the decorated function while still logging elapsed time''',
                'requirements': [
                    'Correct syntax for decorator with optional arguments',
                    'Use functools.wraps to preserve metadata',
                    'Support standalone functions & class methods',
                    'Exception handling without swallowing the error'
                ],
                'difficulty': 'easy',
                'topic': topics['Python'],
                'challenge_type': 'topic',
                'xp_reward': 100,
                'tags': ['python', 'decorators', 'performance', 'profiling'],
                'estimated_time': '20 min',
            },
            {
                'title': 'Build an Infinite Scroll List Component using Intersection Observer',
                'description': '''Create a high-performance infinite scroll React component using the browser's native Intersection Observer API.

Your component should:
1. Render items in a clean grid/list
2. Observe a loader target element at the bottom of the list
3. Fetch the next page of items dynamically from a mock API
4. Handle loading and end-of-list states cleanly
5. Clean up the Intersection Observer instance on unmount to avoid memory leaks
6. Debounce or throttle multiple simultaneous requests''',
                'requirements': [
                    'Use Intersection Observer instead of window scroll event listener',
                    'Observer instance is cleaned up on component unmount',
                    'Loading spinner and final list states handled',
                    'Debouncing mechanism to prevent redundant fetches'
                ],
                'difficulty': 'hard',
                'topic': topics['React'],
                'challenge_type': 'topic',
                'xp_reward': 400,
                'tags': ['react', 'performance', 'infinite-scroll', 'intersection-observer'],
                'estimated_time': '60 min',
            },
            {
                'title': 'Design a Distributed Rate Limiter',
                'description': '''Design a highly scalable, distributed rate limiting system that can restrict client requests across a cluster of servers.

Your design proposal should cover:
1. Choice of algorithm (Token Bucket, Leaky Bucket, Sliding Window Log, Sliding Window Counter)
2. Technology stack choices (e.g. Redis for shared state memory)
3. Multi-node synchronization and consistency models
4. Performance optimization (minimizing latency, pipeline calls to Redis, local memory fallback)
5. Handling edge cases (Redis cluster node crashes, network splits)''',
                'requirements': [
                    'Choose and justify a rate limiting algorithm',
                    'Data structure schema (Redis strings/hashes/sorted sets) details',
                    'Handling race conditions (Redis transactions, Lua scripts)',
                    'Fault tolerance strategies'
                ],
                'difficulty': 'hard',
                'topic': topics['System Design'],
                'challenge_type': 'weekly',
                'xp_reward': 500,
                'tags': ['system-design', 'redis', 'rate-limiting', 'distributed-systems'],
                'estimated_time': '90 min',
            },
            {
                'title': 'Create a Django Signal Handler for Auditing Model Changes',
                'description': '''Write a Django signal-based audit trail generator that automatically records create, update, and delete actions on models.

Your solution must include:
1. Signal hook receiver functions (`post_save`, `post_delete`)
2. Audit Log database model mapping action, changed model, record ID, changed fields, timestamp, and user who performed the action
3. Custom logic to serialize model changes dynamically to JSON format
4. Optimization strategy to prevent database N+1 query overhead in bulk updates''',
                'requirements': [
                    'Use Django post_save and post_delete signals',
                    'Create AuditLog model representation',
                    'JSON serialization of modified fields',
                    'Safe handling of anonymous user actions'
                ],
                'difficulty': 'medium',
                'topic': topics['Django'],
                'challenge_type': 'topic',
                'xp_reward': 200,
                'tags': ['django', 'signals', 'database', 'auditing'],
                'estimated_time': '45 min',
            },
            {
                'title': 'Build a WebSocket Chat Server using Python Asyncio',
                'description': '''Implement a lightweight multi-client chat server using Python's asyncio and websockets library.

Your server should:
1. Accept concurrent WebSocket connections on port 8765
2. Manage a list of active connection client sockets
3. Support broadcast messages, private channels, and user registrations
4. Catch connection closures cleanly and update the active clients pool
5. Include a basic heartbeat mechanism to detect zombie clients''',
                'requirements': [
                    'Use asyncio loop pattern and websockets library',
                    'Handle dynamic connection registers and deregistrations',
                    'Heartbeat checker for inactive client socket drops',
                    'Clean exception catch routines'
                ],
                'difficulty': 'hard',
                'topic': topics['Backend'],
                'challenge_type': 'weekly',
                'xp_reward': 450,
                'tags': ['backend', 'websockets', 'asyncio', 'python'],
                'estimated_time': '75 min',
            },
            {
                'title': 'Implement a Custom Promise Polyfill (MyPromise)',
                'description': '''Build a robust, lightweight ES6 Promise polyfill from scratch.

Your implementation must support:
1. Execution status transitions: Pending, Fulfilled, Rejected
2. Handler registration via `.then()`, `.catch()`, `.finally()`
3. Promise chaining where a `.then` returns a new promise
4. Asynchronous resolver triggers (using microtasks like queueMicrotask or setTimeout)
5. Static utility methods: `MyPromise.resolve()`, `MyPromise.reject()`, `MyPromise.all()`''',
                'requirements': [
                    'Strict transition logic (pending can only go to fulfilled/rejected once)',
                    'Asynchronous task scheduling for then handlers',
                    'Promise chaining support',
                    'Implementation of MyPromise.all()'
                ],
                'difficulty': 'hard',
                'topic': topics['JavaScript'],
                'challenge_type': 'topic',
                'xp_reward': 400,
                'tags': ['javascript', 'promises', 'async', 'polyfill'],
                'estimated_time': '60 min',
            },
            {
                'title': 'Optimize a PostgreSQL Schema with Indexing and Query Tuning',
                'description': '''Analyze and resolve slow query speeds on a relational table holding 10 million transaction records.

Your report should:
1. Explain how to run and read EXPLAIN ANALYZE on PostgreSQL
2. Define B-Tree, GIN, and Hash indexes and when to apply them
3. Optimize search criteria querying a JSONB payload field
4. Redesign tables using partitioning to segment high-volume historical transactions''',
                'requirements': [
                    'Explanation of EXPLAIN/EXPLAIN ANALYZE metrics',
                    'Index selection rules for partial/expression indexes',
                    'JSONB index optimizations (GIN indexes)',
                    'Table partitioning scheme details'
                ],
                'difficulty': 'medium',
                'topic': topics['SQL'],
                'challenge_type': 'topic',
                'xp_reward': 250,
                'tags': ['sql', 'postgres', 'indexes', 'performance', 'query-tuning'],
                'estimated_time': '50 min',
            },
            {
                'title': 'Write a Concurrent Web Scraper using asyncio and aiohttp',
                'description': '''Write a Python script to concurrently scrape job postings from a list of 100 targets without overloading client endpoints.

Your script must:
1. Set up an asynchronous HTTP client session using aiohttp
2. Leverage asyncio.Semaphore to limit concurrent worker tasks
3. Handle request retries, back-off timers, and redirect paths
4. Parse HTML elements using BeautifulSoup or select elements
5. Store results in a thread-safe data format (CSV or JSON)''',
                'requirements': [
                    'Asynchronous network fetching with aiohttp',
                    'Concurrency limit via asyncio.Semaphore',
                    'Retry pattern with exponential back-off',
                    'Thread-safe output writer'
                ],
                'difficulty': 'medium',
                'topic': topics['Python'],
                'challenge_type': 'topic',
                'xp_reward': 250,
                'tags': ['python', 'asyncio', 'aiohttp', 'scraping'],
                'estimated_time': '45 min',
            },
            {
                'title': 'Implement a Least Recently Used (LRU) Cache Eviction Policy',
                'description': '''Implement an LRU Cache with O(1) time complexity for get and put operations.

Your solution must incorporate:
1. HashMap/Dictionary for O(1) key-to-node lookup
2. Doubly Linked List to keep track of access frequencies (recent on top, tail holds lease-recent)
3. Operations: `get(key)` and `put(key, value)`
4. Cache capacity bounds limit eviction triggers
5. Custom implementation of Doubly Linked List nodes''',
                'requirements': [
                    'Strict O(1) execution for both get and put operations',
                    'Doubly Linked List node management',
                    'Evicts correct element when capacity threshold is hit',
                    'Thread safety overview'
                ],
                'difficulty': 'medium',
                'topic': topics['Data Structures'],
                'challenge_type': 'topic',
                'xp_reward': 250,
                'tags': ['algorithms', 'caching', 'lru-cache', 'linkedlist'],
                'estimated_time': '40 min',
            },
            {
                'title': 'Implement a Debounce Function',
                'description': '''Create a custom debounce function in JavaScript.
                
A debounced function delays the execution of the provided function until after a specified wait time has elapsed since the last time the debounced function was invoked.

Your solution should cover:
1. Handling the `this` context correctly
2. Supporting arguments passed to the debounced function
3. Implementing an optional `immediate` flag (runs function on the leading edge instead of trailing edge)
4. Implementing a `cancel` method to cancel pending executions''',
                'requirements': [
                    'Returns a new debounced function wrapper',
                    'Maintains correct context and arguments',
                    'Executes after the specified wait duration',
                    'Includes a cancel() method on the returned function'
                ],
                'difficulty': 'easy',
                'topic': topics['JavaScript'],
                'challenge_type': 'topic',
                'xp_reward': 100,
                'tags': ['javascript', 'debounce', 'functions', 'timing'],
                'estimated_time': '20 min',
            },
            {
                'title': 'Deep Clone Object Implementation',
                'description': '''Write a function `deepClone(obj)` that creates a deep copy of a given value.

Your function must handle:
1. Primitive values (numbers, strings, booleans, null, undefined)
2. Nested objects and arrays
3. Date objects and RegExp objects
4. Circular references (objects referencing themselves directly or indirectly) without running into infinite loops or stack overflow errors''',
                'requirements': [
                    'Returns a completely independent deep copy',
                    'Preserves Dates, RegExps, and Arrays',
                    'Handles circular references successfully',
                    'Avoids modifying the input object'
                ],
                'difficulty': 'medium',
                'topic': topics['JavaScript'],
                'challenge_type': 'topic',
                'xp_reward': 180,
                'tags': ['javascript', 'clone', 'objects', 'recursion'],
                'estimated_time': '35 min',
            },
            {
                'title': 'Implement an Event Emitter Class',
                'description': '''Build a robust, custom `EventEmitter` class in JavaScript to manage events.

The class must support:
1. `subscribe(eventName, callback)`: registers a callback to an event and returns an object with an `unsubscribe()` method
2. `emit(eventName, ...args)`: triggers all registered callbacks for the event with the provided arguments
3. `once(eventName, callback)`: registers a callback that will trigger at most once and then unsubscribe itself''',
                'requirements': [
                    'Subscribe method handles multiple callbacks per event',
                    'Unsubscribe cleans up only the specific callback listener',
                    'Emit triggers all callbacks with any number of arguments',
                    'Once works correctly and automatically cleans up'
                ],
                'difficulty': 'medium',
                'topic': topics['JavaScript'],
                'challenge_type': 'topic',
                'xp_reward': 200,
                'tags': ['javascript', 'event-emitter', 'oop', 'design-patterns'],
                'estimated_time': '30 min',
            },
            {
                'title': 'Build a Simple HTTP Server from Scratch',
                'description': '''Create a basic HTTP server using Python's raw TCP socket API (the socket module) without using any external library or http.server.

Your server should:
1. Bind to localhost and a port, listening for incoming connections
2. Read and parse incoming HTTP request lines, headers, and body
3. Respond with correct HTTP status codes, headers (Content-Length, Content-Type), and body
4. Correctly route request paths (e.g., serve a static index.html or return JSON data)
5. Handle 404 (Not Found) and 500 (Internal Server Error) situations gracefully''',
                'requirements': [
                    'Use socket library to bind, listen, and accept connections',
                    'Parse incoming HTTP requests (method, path, headers)',
                    'Format and send standard HTTP response headers and body',
                    'Route paths and handle errors cleanly'
                ],
                'difficulty': 'hard',
                'topic': topics['Python'],
                'challenge_type': 'weekly',
                'xp_reward': 450,
                'tags': ['python', 'networking', 'sockets', 'http'],
                'estimated_time': '75 min',
            },
            {
                'title': 'Custom Context Manager for Database Connections',
                'description': '''Create a custom Python context manager that manages database connections (using contextlib or class-based __enter__ / __exit__).

Your context manager must:
1. Automatically open/acquire a connection upon entering the context block
2. Cleanly close/release the connection upon exiting the block
3. Support transaction rollback if an exception is raised inside the context block
4. Commit changes if no exceptions occur, and propagate or swallow exceptions based on configuration''',
                'requirements': [
                    'Implement __enter__ and __exit__ methods',
                    'Open/close DB connection lifecycle automatically',
                    'Rollback on exception and commit on success',
                    'Handle exceptions appropriately'
                ],
                'difficulty': 'easy',
                'topic': topics['Python'],
                'challenge_type': 'topic',
                'xp_reward': 100,
                'tags': ['python', 'contextmanager', 'database', 'exceptions'],
                'estimated_time': '20 min',
            },
            {
                'title': 'Build a Thread-Safe Connection Pool',
                'description': '''Design and implement a thread-safe connection pool in Python.

A connection pool manages a set of reusable connections. Multiple threads should be able to check out connections concurrently.

Your implementation must:
1. Limit the maximum number of open connections
2. Block threads requesting a connection when the pool is exhausted (with an optional timeout)
3. Ensure thread safety when checking connections in and out using locks or queues
4. Recycle dead or broken connections automatically''',
                'requirements': [
                    'Limit pool capacity and reuse connections',
                    'Use threading.Lock or queue.Queue for thread safety',
                    'Handle blocking and timeout when pool is empty',
                    'Detect and replace closed/unusable connections'
                ],
                'difficulty': 'medium',
                'topic': topics['Python'],
                'challenge_type': 'topic',
                'xp_reward': 250,
                'tags': ['python', 'threading', 'concurrency', 'connection-pool'],
                'estimated_time': '45 min',
            },
            {
                'title': 'Reusable Modal with Focus Trap',
                'description': '''Create a reusable React modal component that supports accessible focus behavior.

When the modal opens:
1. Focus must move to the modal container or a specified element inside it
2. Pressing the Tab key must loop focus only through the interactive elements inside the modal, never escaping to the parent page (Focus Trap)
3. Pressing the Escape key should close the modal
4. Focus must return to the trigger element that opened the modal when it is closed''',
                'requirements': [
                    'Accessible keyboard navigation (Tab/Shift-Tab focus cycle)',
                    'Escape key closes the modal',
                    'Focus returns to the triggering element on close',
                    'Supports custom modal content via React children'
                ],
                'difficulty': 'medium',
                'topic': topics['React'],
                'challenge_type': 'topic',
                'xp_reward': 200,
                'tags': ['react', 'accessibility', 'focus-trap', 'modal'],
                'estimated_time': '40 min',
            },
            {
                'title': 'Form Validator Custom Hook with Schema',
                'description': '''Write a custom React hook `useForm` that handles form state, submission, and validation using a custom validation schema.

The hook should:
1. Maintain form field values
2. Perform validation on input change and on form submission
3. Track error messages for each field
4. Support tracking dirty/touched fields to only validate fields the user interacted with
5. Offer a simple API for checking form validity state''',
                'requirements': [
                    'Hook signature: useForm({ initialValues, validationSchema })',
                    'Tracks values, errors, and touched status per field',
                    'Validates on change and on submit',
                    'Handles asynchronous or synchronous form submissions'
                ],
                'difficulty': 'medium',
                'topic': topics['React'],
                'challenge_type': 'topic',
                'xp_reward': 220,
                'tags': ['react', 'hooks', 'forms', 'validation'],
                'estimated_time': '35 min',
            },
            {
                'title': 'Virtualized List Component',
                'description': '''Create a high-performance React component that renders a large dataset of 10,000 items by virtualizing the list.

Virtualization only renders elements currently visible in the browser viewport plus a small buffer.

Your component must:
1. Dynamically calculate which items are visible based on container scroll position
2. Position visible items absolutely within a scrollable container of the total height
3. Maintain smooth scrolling performance without lag or white flashes
4. Handle variable item heights (bonus)''',
                'requirements': [
                    'Only renders items in the viewport plus a small buffer',
                    'Computes total container height correctly based on item count',
                    'Calculates indices based on scroll offset',
                    'Maintains 60fps scrolling performance'
                ],
                'difficulty': 'hard',
                'topic': topics['React'],
                'challenge_type': 'topic',
                'xp_reward': 500,
                'tags': ['react', 'performance', 'virtualization', 'list'],
                'estimated_time': '60 min',
            },
            {
                'title': 'Custom Middleware for Request Logging',
                'description': '''Write a custom Django middleware that logs request statistics and implements a simple IP-based rate limiter.

The middleware must:
1. Record HTTP method, request path, status code, IP address, and execution duration
2. Write records to a log file or output database table
3. Track requests per IP address in Redis or Django cache
4. Reject requests exceeding 100 per minute with a 429 Too Many Requests response''',
                'requirements': [
                    'Implement Django middleware structure (process_request/process_response)',
                    'Measure and log request processing duration',
                    'Cache request counts per IP with TTL expiration',
                    'Return HTTP 429 when threshold exceeded'
                ],
                'difficulty': 'medium',
                'topic': topics['Django'],
                'challenge_type': 'topic',
                'xp_reward': 220,
                'tags': ['django', 'middleware', 'logging', 'rate-limiting'],
                'estimated_time': '40 min',
            },
            {
                'title': 'Role-Based Access Control Custom Permissions',
                'description': '''Implement dynamic Role-Based Access Control (RBAC) permissions inside Django REST Framework.

Your system should:
1. Define custom roles: Administrator, Manager, Member, Guest
2. Create custom permission classes (`BasePermission` subclasses) that evaluate user roles against request actions (GET, POST, PUT, DELETE)
3. Implement permissions check dynamic rules (e.g. Managers can edit, but not delete, models)
4. Store role mappings in a clean relationship model''',
                'requirements': [
                    'Subclass DRF BasePermission with custom logic',
                    'Handle mapping user roles to HTTP methods/actions',
                    'Enforce rules dynamically based on model attributes',
                    'Return HTTP 403 Forbidden with helpful reason'
                ],
                'difficulty': 'medium',
                'topic': topics['Django'],
                'challenge_type': 'topic',
                'xp_reward': 200,
                'tags': ['django', 'permissions', 'rbac', 'security'],
                'estimated_time': '35 min',
            },
            {
                'title': 'Design a Notification System',
                'description': '''Design a highly scalable, multi-channel notification system that sends email, SMS, and in-app push notifications.

Your design should cover:
1. Endpoints for triggering notifications from multiple services
2. Queue architectures (e.g. RabbitMQ/Celery) for asynchronous and parallel processing
3. Dealing with providers (Sendgrid, Twilio, Firebase) and handling failures (retry policies, dead letter queues)
4. User preference management (opt-in/opt-out channels)
5. Preventing spam (rate limiting/deduplication of identical messages)''',
                'requirements': [
                    'System architecture layout and flow diagram description',
                    'Message queue setup and processing worker model',
                    'Handling channel failures and retries gracefully',
                    'User preference and unsubscribe logic storage'
                ],
                'difficulty': 'medium',
                'topic': topics['System Design'],
                'challenge_type': 'topic',
                'xp_reward': 300,
                'tags': ['system-design', 'notification', 'queues', 'asynchronous'],
                'estimated_time': '45 min',
            },
            {
                'title': 'Design a Live Video Streaming Service',
                'description': '''Design the backend infrastructure for a massive live streaming platform like Twitch or YouTube Live.

Your design proposal should cover:
1. Video ingestion protocol (RTMP/WebRTC) and live transcoding pipelines
2. Video distribution mechanisms (HLS/DASH) and CDN integration
3. Low latency delivery to millions of concurrent viewers
4. Handling real-time chat with high message throughput
5. Recording and storing streams for Video-On-Demand (VOD) playback''',
                'requirements': [
                    'Ingress, transcoding, and egress system design description',
                    'Scalability and latency reduction configurations',
                    'Chat architecture capable of handling millions of connections',
                    'VOD conversion and cold storage strategy'
                ],
                'difficulty': 'hard',
                'topic': topics['System Design'],
                'challenge_type': 'weekly',
                'xp_reward': 500,
                'tags': ['system-design', 'video-streaming', 'hls', 'cdn', 'websockets'],
                'estimated_time': '90 min',
            },
            {
                'title': 'Trie (Prefix Tree) with Autocomplete',
                'description': '''Implement a Trie (Prefix Tree) data structure optimized for fast prefix-based autocomplete search.

Your Trie class must support:
1. `insert(word)`: Inserts a word into the trie
2. `search(word)`: Returns true if the word is in the trie
3. `startsWith(prefix)`: Returns true if there is any word in the trie that starts with the given prefix
4. `autocomplete(prefix)`: Returns a list of all words in the trie matching the prefix, sorted alphabetically or by weight''',
                'requirements': [
                    'Implement TrieNode and Trie classes',
                    'O(L) search, insert, startsWith (L = length of search key)',
                    'Autocomplete returns matching strings',
                    'Handle empty inputs and case sensitivity'
                ],
                'difficulty': 'medium',
                'topic': topics['Data Structures'],
                'challenge_type': 'topic',
                'xp_reward': 250,
                'tags': ['algorithms', 'trie', 'trees', 'search'],
                'estimated_time': '40 min',
            },
            {
                'title': 'Balanced Parentheses Validator',
                'description': '''Write a function that checks if a string containing parentheses, brackets, and braces is balanced.

Example: `{[()]}` is balanced, but `{[(])}` is not.

Your solution must:
1. Use a Stack data structure
2. Parse characters efficiently in O(n) time and O(n) space
3. Correctly handle closing brackets without opening counterparts and vice versa
4. Ignore non-bracket characters if present in the string''',
                'requirements': [
                    'Utilizes stack data structure principles',
                    'O(N) time and space complexity',
                    'Handles empty strings and strings without brackets',
                    'Handles nested matching groups correctly'
                ],
                'difficulty': 'easy',
                'topic': topics['Data Structures'],
                'challenge_type': 'topic',
                'xp_reward': 80,
                'tags': ['algorithms', 'stack', 'strings', 'validation'],
                'estimated_time': '15 min',
            },
            {
                'title': 'Write a Query to Calculate 7-Day Rolling Average of Active Users',
                'description': '''Write a SQL query that calculates the 7-day rolling average of daily active users (DAU) from an user activities table.

Table Schema (`user_activity`):
- `id` (int)
- `user_id` (int)
- `activity_date` (date)
- `activity_type` (varchar)

The output should list:
1. `activity_date`
2. Count of active users on that day (DAU)
3. 7-day rolling average of DAU (average of current day and previous 6 days) using window functions''',
                'requirements': [
                    'Aggregate activity by day to get DAU',
                    'Use SQL Window function (AVG) over preceding rows',
                    'Sort results chronologically',
                    'Proper handling of days with missing activities'
                ],
                'difficulty': 'medium',
                'topic': topics['SQL'],
                'challenge_type': 'topic',
                'xp_reward': 200,
                'tags': ['sql', 'window-functions', 'aggregations', 'metrics'],
                'estimated_time': '30 min',
            },
            {
                'title': 'Write a Query to Detect Fraudulent Financial Transactions',
                'description': '''Write a query to identify potential fraud cases in a transaction ledger.

Potential fraud is defined as:
1. A user making multiple transactions of amount greater than $1,000 within a 5-minute window.
2. A user making transactions from two different locations within 1 hour.

Provide SQL query definitions to retrieve:
- Transaction IDs that flag these scenarios
- Relevant timestamps and user IDs for audit''',
                'requirements': [
                    'Use self-joins or window functions with time intervals',
                    'Filter transactions by amount thresholds',
                    'Locational delta calculation within a time window',
                    'Clear outputs containing audit info'
                ],
                'difficulty': 'medium',
                'topic': topics['SQL'],
                'challenge_type': 'topic',
                'xp_reward': 220,
                'tags': ['sql', 'analytics', 'self-join', 'fraud-detection'],
                'estimated_time': '35 min',
            },
            {
                'title': 'Implement a Redis-backed Distributed Lock',
                'description': '''Create a robust, distributed lock mechanism using Python and Redis.

Distributed locks are required in multi-node clusters where local locks (like threading.Lock) are insufficient.

Your solution must implement:
1. `acquire_lock(lock_name, acquire_timeout, lock_timeout)`: acquires a lock with a unique identifier and a lease expiration time (TTL) to prevent deadlocks if the client crashes
2. `release_lock(lock_name, lock_id)`: releases the lock safely only if the client holds the lock (using a Lua script to guarantee atomicity)
3. Retrying acquisition with exponential back-off''',
                'requirements': [
                    'Set lock in Redis with SETNX and TTL atomically',
                    'Release lock using Lua script to check ID equality before DELETE',
                    'Handle lock expiration and automatic renewal (heartbeat) (bonus)',
                    'Retry logic to prevent thread exhaustion'
                ],
                'difficulty': 'hard',
                'topic': topics['Backend'],
                'challenge_type': 'topic',
                'xp_reward': 400,
                'tags': ['backend', 'redis', 'distributed-lock', 'concurrency'],
                'estimated_time': '50 min',
            },
            {
                'title': 'Build a Dockerized Microservice with Health Check Endpoint',
                'description': '''Build a complete, containerized Python microservice that includes health check endpoints.

The service must:
1. Expose a `/health` endpoint returning database and cache connection status
2. Expose a `/metrics` endpoint returning basic process statistics (CPU, memory, uptime)
3. Include a `Dockerfile` optimized for build caching, small image size, and security (non-root user)
4. Include a `docker-compose.yml` defining the service, a DB, a Cache, and a healthy startup dependency order''',
                'requirements': [
                    'Flask/FastAPI/Django endpoints for health and metrics status',
                    'Multi-stage build Dockerfile running as non-root user',
                    'docker-compose setup with healthcheck parameters',
                    'Handle database connection checks dynamically'
                ],
                'difficulty': 'medium',
                'topic': topics['Backend'],
                'challenge_type': 'topic',
                'xp_reward': 200,
                'tags': ['backend', 'docker', 'devops', 'health-check'],
                'estimated_time': '40 min',
            },
            {
                'title': 'Build a Markdown Live Previewer Component',
                'description': '''Build an interactive, real-time Markdown editor component in React.

Your project solution should include:
1. Two-pane layout with a raw text input editor on the left and live HTML preview on the right
2. Real-time rendering for titles, bold text, lists, code blocks, and blockquotes
3. Word count and character counter in footer toolbar
4. LocalStorage persistence so draft text is preserved across browser reloads
5. Copy formatted HTML / Markdown button with instant feedback toast notification''',
                'requirements': [
                    'Two-pane split layout editor and live preview panel',
                    'Support markdown parsing (headings, bold, lists, code blocks)',
                    'Real-time word and character counter',
                    'LocalStorage draft auto-save & restore',
                    'One-click Copy HTML action'
                ],
                'difficulty': 'easy',
                'topic': topics['React'],
                'challenge_type': 'weekly',
                'xp_reward': 250,
                'tags': ['react', 'project', 'markdown', 'frontend'],
                'estimated_time': '35 min',
            },
            {
                'title': 'CLI Weather & Location Dashboard Tool',
                'description': '''Build a command-line interface weather tool in Python with rich terminal formatting.

Your project solution should include:
1. Command argument parsing for city names or `--current-location`
2. Fetching real-time weather data from a mock or public weather REST API
3. Celsius to Fahrenheit unit toggling (`--unit F` or `--unit C`)
4. Colored output for temperatures (blue for freezing, orange/red for heat)
5. Local response caching using JSON or SQLite to prevent redundant API calls''',
                'requirements': [
                    'CLI argument parsing using argparse or click',
                    'HTTP API integration with error handling',
                    'Support metric/imperial temperature conversion',
                    'Colorized terminal output representation',
                    'File-based response caching strategy'
                ],
                'difficulty': 'easy',
                'topic': topics['Python'],
                'challenge_type': 'weekly',
                'xp_reward': 250,
                'tags': ['python', 'cli', 'project', 'api'],
                'estimated_time': '30 min',
            },
            {
                'title': 'Personal Portfolio REST API',
                'description': '''Design and implement a clean Django REST Framework backend API for a portfolio website.

Your project solution should include:
1. Endpoints for Project list (`/api/projects/`) and Project details (`/api/projects/<id>/`)
2. Endpoints for Skills grouped by category (`/api/skills/`)
3. Contact submission endpoint (`/api/contact/`) with email format validation
4. Admin authorization for creating/editing projects while public users have read-only access
5. Response pagination and filtering by tech stack tag''',
                'requirements': [
                    'Django models for Project, Skill, and ContactMessage',
                    'DRF serializers with custom validation',
                    'Permission classes (IsAdminUser for write, AllowAny for read)',
                    'Filter projects by technology tag parameter',
                    'Clean JSON structure with status codes'
                ],
                'difficulty': 'easy',
                'topic': topics['Django'],
                'challenge_type': 'weekly',
                'xp_reward': 250,
                'tags': ['django', 'rest-api', 'project', 'portfolio'],
                'estimated_time': '40 min',
            },
            {
                'title': 'Interactive Kanban Task Board App',
                'description': '''Build a drag-and-drop interactive Kanban task management web app.

Your project solution should include:
1. 3 default columns: "To Do", "In Progress", and "Completed"
2. Create, inline edit, and delete task cards within any column
3. Drag-and-drop or one-click action to move tasks between status columns
4. Priority badges (High, Medium, Low) and search filter by title/tag
5. Persistent storage in LocalStorage or mock API backend''',
                'requirements': [
                    'Dynamic column structure with add/edit/delete tasks',
                    'Move task between columns smoothly',
                    'Priority tags and live search filter',
                    'LocalStorage or state persistence',
                    'Responsive UI grid layout'
                ],
                'difficulty': 'medium',
                'topic': topics['React'],
                'challenge_type': 'weekly',
                'xp_reward': 350,
                'tags': ['react', 'project', 'kanban', 'state-management'],
                'estimated_time': '50 min',
            },
            {
                'title': 'Real-time Notification Engine with WebSockets',
                'description': '''Build a real-time event-driven notification microservice in Python / Django Channels.

Your project solution should include:
1. WebSocket connection endpoint for authenticated users
2. Event broadcast publisher for system alerts, achievements, and messages
3. Unread count badge tracker and mark-as-read API endpoints
4. Redis channel layer pub/sub backend for multi-worker scaling
5. Fallback queue for offline users when reconnected''',
                'requirements': [
                    'WebSocket handshakes and message handler',
                    'Redis channel layer integration',
                    'Unread notification counter logic',
                    'Broadcast vs targeted direct notifications',
                    'Graceful connection disconnect handling'
                ],
                'difficulty': 'medium',
                'topic': topics['Backend'],
                'challenge_type': 'weekly',
                'xp_reward': 400,
                'tags': ['backend', 'project', 'websockets', 'redis'],
                'estimated_time': '60 min',
            },
            {
                'title': 'E-Commerce Multi-Filter Query Engine',
                'description': '''Write optimized SQL queries and index strategies for a complex e-commerce search engine.

Your project solution should include:
1. Schema for Products, Categories, Attributes, Reviews, and Inventory
2. SQL query supporting multi-attribute filtering (category, price range, rating, in-stock)
3. Full-text keyword search across product titles and descriptions
4. B-Tree and GIN index design for sub-10ms query performance
5. Pagination with cursor-based or offset strategy handling millions of rows''',
                'requirements': [
                    'Normalized database schema design',
                    'Complex SQL query with JOINs, GROUP BY, and HAVING',
                    'Full-text search query implementation',
                    'Indexes definition for search fields',
                    'Performance execution plan analysis'
                ],
                'difficulty': 'medium',
                'topic': topics['SQL'],
                'challenge_type': 'weekly',
                'xp_reward': 350,
                'tags': ['sql', 'project', 'database', 'indexing'],
                'estimated_time': '45 min',
            },
        ]

        for c in challenges_data:
            challenge, created = Challenge.objects.get_or_create(
                title=c['title'],
                defaults={k: v for k, v in c.items() if k != 'title'}
            )
            if created:
                self.stdout.write(f"  [+] Created challenge: {c['title']}")
            else:
                self.stdout.write(f"  [-] Already exists: {c['title']}")

        # Seed Showcase Sample Projects if none exist
        from showcase.models import Project, ProjectTag
        from django.contrib.auth import get_user_model
        User = get_user_model()
        first_user = User.objects.first()

        if first_user:
            sample_projects = [
                # EASY PROJECTS
                {
                    'title': 'StudyVerse',
                    'description': 'AI powered platform for students for learning with interactive flashcards, adaptive quiz engines, and study group collaboration spaces.',
                    'github_url': 'https://github.com/example/studyverse',
                    'live_url': 'https://studyverse.demo.com',
                    'tags': ['easy', 'react', 'python', 'ai']
                },
                {
                    'title': 'DevNotes',
                    'description': 'Lightweight Markdown Live Previewer & Developer Snippet Manager with syntax highlighting and instant local storage persistence.',
                    'github_url': 'https://github.com/example/devnotes',
                    'live_url': 'https://devnotes.demo.com',
                    'tags': ['easy', 'javascript', 'markdown', 'frontend']
                },
                {
                    'title': 'WeatherFlow',
                    'description': 'Real-time weather forecast & geolocation analytics dashboard featuring interactive map layers and dynamic weather telemetry.',
                    'github_url': 'https://github.com/example/weatherflow',
                    'live_url': 'https://weatherflow.demo.com',
                    'tags': ['easy', 'react', 'weather-api', 'css']
                },
                # MEDIUM PROJECTS
                {
                    'title': 'SkillBridge',
                    'description': 'SkillBridge is a freelance collaboration platform that connects skilled freelancers directly with clients without unnecessary middlemen. Built to simplify job matching and escrow contracts.',
                    'github_url': 'https://github.com/example/skillbridge',
                    'live_url': 'https://skillbridge.demo.com',
                    'tags': ['medium', 'django', 'c#', 'rest-api']
                },
                {
                    'title': 'TaskHelix',
                    'description': 'Real-time Kanban workspace & team task management board with drag-and-drop workflow status, webhooks, and assignment telemetry.',
                    'github_url': 'https://github.com/example/taskhelix',
                    'live_url': 'https://taskhelix.demo.com',
                    'tags': ['medium', 'react', 'node', 'socket.io']
                },
                {
                    'title': 'ChatPulse Engine',
                    'description': 'High-performance WebSocket multi-room chat server and real-time event notification pipeline built with Python Asyncio.',
                    'github_url': 'https://github.com/example/chatpulse',
                    'live_url': 'https://chatpulse.demo.com',
                    'tags': ['medium', 'python', 'asyncio', 'websockets']
                },
                # HARD PROJECTS
                {
                    'title': 'FairLens',
                    'description': 'FairLens is an AI-powered bias detection and auditing platform that analyzes datasets and model predictions to ensure fairness and compliance with ethical ML standards.',
                    'github_url': 'https://github.com/example/fairlens',
                    'live_url': 'https://fairlens.demo.com',
                    'tags': ['hard', 'python', 'machine-learning', 'pytorch']
                },
                {
                    'title': 'ApexQueue',
                    'description': 'Distributed high-throughput async message broker & distributed job queue engine built for low-latency microservice task execution.',
                    'github_url': 'https://github.com/example/apexqueue',
                    'live_url': 'https://apexqueue.demo.com',
                    'tags': ['hard', 'system-design', 'redis', 'distributed']
                },
                {
                    'title': 'CloudScale Engine',
                    'description': 'Enterprise Kubernetes orchestration blueprint & automated load balancing pipeline with zero-downtime Canary deployment controllers.',
                    'github_url': 'https://github.com/example/cloudscale',
                    'live_url': 'https://cloudscale.demo.com',
                    'tags': ['hard', 'docker', 'kubernetes', 'devops']
                }
            ]

            for sp in sample_projects:
                proj, created = Project.objects.get_or_create(
                    title=sp['title'],
                    defaults={
                        'user': first_user,
                        'description': sp['description'],
                        'github_url': sp['github_url'],
                        'live_url': sp['live_url'],
                        'is_featured': True
                    }
                )
                for tag_name in sp['tags']:
                    tag_obj, _ = ProjectTag.objects.get_or_create(name=tag_name)
                    proj.tags.add(tag_obj)
                if created:
                    self.stdout.write(f"  [+] Seeded showcase project: {sp['title']}")

        self.stdout.write(self.style.SUCCESS('\n[Seed Completed] Seed data completed successfully!'))
