# 🚀 Performance Analysis Guide

Comprehensive guide to analyzing Node.js application performance using 0x flame graphs and Node.js built-in profiler.

## 📋 Table of Contents

- [Overview](#overview)
- [Tools Comparison](#tools-comparison)
- [0x Flame Graph Analysis](#0x-flame-graph-analysis)
- [Node.js Built-in Profiler](#nodejs-built-in-profiler)
- [Complete Workflow](#complete-workflow)
- [Interpreting Results](#interpreting-results)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Performance analysis helps identify bottlenecks in CPU usage, memory allocation, and I/O operations. This guide covers two primary tools:

- **0x**: Visual flame graphs for JavaScript function analysis
- **Node.js --prof**: System-wide CPU profiling with detailed statistics

## 🔧 Tools Comparison

| Feature | 0x | Node.js --prof | Best Use Case |
|---------|----|--------------:|---------------|
| **Visual Output** | ✅ Interactive HTML | ❌ Text report | Understanding call patterns |
| **JavaScript Focus** | ✅ Detailed JS analysis | ⚠️ Basic JS info | Function-level optimization |
| **System Overview** | ❌ Limited | ✅ Complete picture | Overall performance assessment |
| **Memory Analysis** | ❌ No | ❌ No | Use `--inspect` + Chrome DevTools |
| **Production Ready** | ⚠️ Dev/staging | ✅ Production safe | Depends on environment |
| **Setup Complexity** | Simple | Simpler | - |

## 🔥 0x Flame Graph Analysis

### Installation

```bash
# Install as dev dependency
pnpm add -D 0x

# Or globally
npm install -g 0x
```

### Basic Usage

```bash
# Start profiling
npx 0x -- node dist/src/main.js

# In another terminal, generate load
autocannon -c 10 -a 1000 http://localhost:3000/your-endpoint

# Stop profiling (Ctrl+C)
# Flame graph will be generated automatically
```

### Advanced Usage

```bash
# Collect data without immediate visualization
npx 0x --collect-only -- node dist/src/main.js

# Custom output directory
npx 0x --output-dir ./performance-reports -- node dist/src/main.js

# Include kernel stacks (Linux only)
npx 0x --kernel-tracing -- node dist/src/main.js
```

### Reading Flame Graphs

#### 📊 Visual Elements

- **Width**: Time spent in function (wider = more CPU time)
- **Height**: Call stack depth (deeper = more nested calls)
- **Color**: Different functions (consistent within same function)
- **Interactive**: Click to zoom, hover for details

#### 🔍 What to Look For

1. **Wide Plateaus**: Functions consuming most CPU time
2. **Tall Towers**: Deep call stacks (potential recursion issues)
3. **Repeated Patterns**: Inefficient loops or repeated operations
4. **Red/Orange Sections**: CPU-intensive operations

#### 🎯 Optimization Targets

```typescript
// Example: Wide section in flame graph
function processLargeDataset(data) {
  // If this appears wide in flame graph:
  return data.map(item => {
    return expensiveOperation(item); // Optimize this
  });
}

// Optimization approach:
function processLargeDatasetOptimized(data) {
  // Use batch processing or worker threads
  const chunks = chunkArray(data, 100);
  return Promise.all(chunks.map(chunk => 
    processChunkAsync(chunk)
  ));
}
```

## 📈 Node.js Built-in Profiler

### Basic CPU Profiling

```bash
# Start application with profiling
node --prof dist/src/main.js

# Generate load (in another terminal)
autocannon -c 10 -a 1000 http://localhost:3000/your-endpoint

# Stop application (Ctrl+C)
# This generates isolate-*.log files

# Process the log file
node --prof-process isolate-*.log > cpu-profile.txt
```

### Advanced Profiling Options

```bash
# Heap profiling (memory)
node --inspect dist/src/main.js
# Open Chrome DevTools: chrome://inspect

# Memory snapshots
node --heapsnapshot-signal=SIGUSR2 dist/src/main.js
# Send signal: kill -USR2 <pid>

# CPU profiling with sampling frequency
node --prof --prof-process --logfile=v8.log dist/src/main.js
```

### Interpreting CPU Profile Results

#### 📊 Report Sections

1. **JavaScript**: Your application code performance
2. **C++**: Node.js internal operations and native modules
3. **GC**: Garbage collection overhead
4. **Shared libraries**: System library usage

#### 🎯 Key Metrics

```
Statistical profiling result from isolate-*.log, (1736 ticks, 831 unaccounted, 0 excluded).

[JavaScript]:
   ticks  total  nonlib   name
     12    0.7%    0.7%  Builtin: FindOrderedHashMapEntry
     10    0.6%    0.6%  JS: *resolve node:path:1162:10
     
[C++]:
   ticks  total  nonlib   name
    249   14.3%   14.7%  fwrite
     83    4.8%    4.9%  std::__ostream_insert

[Summary]:
   ticks  total  nonlib   name
    164    9.4%    9.7%  JavaScript
    702   40.4%   41.4%  C++
     48    2.8%    2.8%  GC
```

#### 📈 Performance Interpretation

| JavaScript % | Assessment | Action |
|---------------|------------|--------|
| < 15% | ✅ Excellent | Monitor only |
| 15-30% | ✅ Good | Minor optimizations |
| 30-50% | ⚠️ Moderate | Profile specific functions |
| > 50% | ❌ Poor | Major refactoring needed |

| GC % | Assessment | Action |
|------|------------|--------|
| < 5% | ✅ Excellent | No action needed |
| 5-10% | ✅ Good | Monitor memory patterns |
| 10-20% | ⚠️ High | Review object lifecycle |
| > 20% | ❌ Critical | Memory leak investigation |

## 🔄 Complete Workflow

### 1. Pre-Analysis Setup

```bash
# Ensure application is built
pnpm build

# Install profiling tools
pnpm add -D 0x autocannon

# Clear any existing cache (for accurate cold-start analysis)
docker exec redis_container redis-cli FLUSHALL
```

### 2. Baseline Performance Test

```bash
# Test current performance without profiling
autocannon -c 10 -a 1000 http://localhost:3000/endpoint

# Note: baseline latency, throughput, error rate
```

### 3. 0x Flame Graph Analysis

```bash
# Step 1: Start 0x profiling
npx 0x -- node dist/src/main.js

# Step 2: Generate diverse load (test multiple endpoints)
autocannon -c 8 -a 300 http://localhost:3000/listing
autocannon -c 8 -a 300 http://localhost:3000/listing/featured
autocannon -c 5 -a 200 http://localhost:3000/listing/max-price

# Step 3: Stop profiling (Ctrl+C)
# Flame graph opens automatically

# Step 4: Analyze results
# - Look for wide sections (CPU bottlenecks)
# - Identify unoptimized code patterns
# - Note hot paths in your application
```

### 4. Node.js Built-in Profiling

```bash
# Step 1: Start CPU profiling
node --prof dist/src/main.js

# Step 2: Generate similar load
autocannon -c 10 -a 1000 http://localhost:3000/endpoint

# Step 3: Stop and process
# Ctrl+C to stop
node --prof-process isolate-*.log > detailed-analysis.txt

# Step 4: Analyze system-wide performance
cat detailed-analysis.txt | head -100
```

### 5. Multi-Endpoint Analysis

```bash
#!/bin/bash
# performance-test.sh

echo "🚀 Starting comprehensive performance analysis..."

# Start profiling
node --prof dist/src/main.js &
APP_PID=$!

sleep 5  # Wait for app to start

echo "📊 Testing main endpoints..."

# Test different endpoints with varying loads
autocannon -c 10 -a 500 http://localhost:3000/listing
autocannon -c 8 -a 300 http://localhost:3000/listing/featured  
autocannon -c 5 -a 200 http://localhost:3000/listing/max-price
autocannon -c 3 -a 100 http://localhost:3000/cache/health

echo "🔄 Stopping profiler..."
kill -INT $APP_PID
wait $APP_PID

echo "📈 Processing results..."
node --prof-process isolate-*.log > comprehensive-analysis.txt

echo "✅ Analysis complete! Check comprehensive-analysis.txt"
```

## 🎯 Interpreting Results

### Application Performance Categories

#### 🟢 Excellent Performance (Like Kumakatok Backend)
```
✅ JavaScript: 9.4% (CPU efficient)
✅ C++: 40.4% (I/O bound - expected for web APIs)
✅ GC: 2.8% (good memory management)
✅ Cache hit ratio: >95%
✅ Response times: 1-40ms
```

#### 🟡 Good Performance
```
⚠️ JavaScript: 15-25%
⚠️ GC: 5-10%
⚠️ Cache hit ratio: 80-95%
⚠️ Response times: 50-100ms
```

#### 🔴 Performance Issues
```
❌ JavaScript: >30%
❌ GC: >15%
❌ Cache hit ratio: <70%
❌ Response times: >200ms
```

### Common Patterns and Solutions

#### Pattern 1: High JavaScript %
```typescript
// Problem: Inefficient data processing
const result = largeArray.map(item => 
  expensiveSync(item)
);

// Solution: Async processing or streaming
const result = await Promise.all(
  chunks.map(chunk => processChunkAsync(chunk))
);
```

#### Pattern 2: High GC %
```typescript
// Problem: Excessive object creation
app.get('/endpoint', (req, res) => {
  const data = {}; // New object every request
  data.items = []; // New array every request
  // ... populate data
  res.json(data);
});

// Solution: Object reuse and pooling
const dataPool = createObjectPool();
app.get('/endpoint', (req, res) => {
  const data = dataPool.acquire();
  // ... populate data
  res.json(data);
  dataPool.release(data);
});
```

#### Pattern 3: High C++ % from JSON Operations
```typescript
// Problem: Large object serialization
const hugeObject = await database.findWithAllRelations();
res.json(hugeObject); // Expensive JSON.stringify

// Solution: Selective serialization
const optimizedData = {
  id: hugeObject.id,
  title: hugeObject.title,
  // Only include necessary fields
};
res.json(optimizedData);
```

## 🚨 Troubleshooting

### Common Issues

#### 0x Issues

**Problem**: Flame graph shows minimal data
```bash
# Solution: Ensure sufficient load generation
autocannon -c 15 -a 2000 http://localhost:3000/endpoint

# Or: Test more CPU-intensive endpoints
# Avoid endpoints that are 100% cached
```

**Problem**: "Premature close" errors
```bash
# Solution: Use shorter tests
autocannon -c 5 -a 200 http://localhost:3000/endpoint

# Or: Use collect-only mode
npx 0x --collect-only -- node dist/src/main.js
```

#### Node.js Profiler Issues

**Problem**: No isolate-*.log files generated
```bash
# Ensure proper shutdown
kill -INT $PID  # Not kill -9

# Check file permissions
ls -la isolate-*.log
```

**Problem**: Empty or minimal profile data
```bash
# Increase test duration
autocannon -c 10 -d 60 http://localhost:3000/endpoint

# Or: Generate more diverse load
# Test multiple endpoints simultaneously
```

### Performance Testing Best Practices

#### 🎯 Load Generation Guidelines

```bash
# Light load: Cache analysis
autocannon -c 3 -a 100 http://localhost:3000/endpoint

# Medium load: Normal operation analysis  
autocannon -c 8 -a 500 http://localhost:3000/endpoint

# Heavy load: Stress testing
autocannon -c 15 -a 2000 http://localhost:3000/endpoint

# Mixed load: Realistic scenarios
parallel ::: \
  "autocannon -c 5 -a 200 http://localhost:3000/listing" \
  "autocannon -c 3 -a 150 http://localhost:3000/listing/featured" \
  "autocannon -c 2 -a 100 http://localhost:3000/listing/max-price"
```

#### 📊 Environment Considerations

```bash
# Development: Use both tools
npx 0x -- node dist/src/main.js  # Visual analysis
node --prof dist/src/main.js     # Detailed metrics

# Staging: Focus on realistic load
# Use production-like data volumes
# Test with production cache patterns

# Production: Use built-in profiler only
node --prof dist/src/main.js
# Minimal overhead, safe for production
```

## 📝 Creating Performance Reports

### Automated Report Generation

```bash
#!/bin/bash
# generate-performance-report.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="performance-reports/$TIMESTAMP"
mkdir -p "$REPORT_DIR"

echo "🎯 Generating performance report: $REPORT_DIR"

# 1. Baseline metrics
echo "📊 Baseline Performance Test" > "$REPORT_DIR/baseline.txt"
autocannon -c 10 -a 1000 http://localhost:3000/listing >> "$REPORT_DIR/baseline.txt"

# 2. CPU profiling
echo "🔥 Starting CPU profiling..."
node --prof dist/src/main.js &
APP_PID=$!
sleep 3

# Generate test load
autocannon -c 10 -a 1500 http://localhost:3000/listing > "$REPORT_DIR/load-test.txt"

# Stop and process
kill -INT $APP_PID
wait $APP_PID
node --prof-process isolate-*.log > "$REPORT_DIR/cpu-profile.txt"

# 3. Generate summary
cat > "$REPORT_DIR/summary.md" << EOF
# Performance Report - $TIMESTAMP

## Test Configuration
- Connections: 10
- Requests: 1500  
- Target: /listing endpoint

## Key Metrics
$(grep -A 10 "Statistical profiling result" "$REPORT_DIR/cpu-profile.txt")

## Recommendations
- Review JavaScript % if >15%
- Check GC % if >5%
- Analyze wide sections in flame graphs
EOF

echo "✅ Report generated: $REPORT_DIR"
```

### Performance Monitoring Integration

```typescript
// performance-monitor.ts
import { performance } from 'perf_hooks';

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTimer(operation: string): string {
    const id = `${operation}_${Date.now()}_${Math.random()}`;
    performance.mark(`start_${id}`);
    return id;
  }

  endTimer(id: string): number {
    performance.mark(`end_${id}`);
    performance.measure(id, `start_${id}`, `end_${id}`);
    
    const measure = performance.getEntriesByName(id)[0];
    const duration = measure.duration;
    
    // Store for analysis
    const operation = id.split('_')[0];
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
    
    return duration;
  }

  getStats(operation: string) {
    const durations = this.metrics.get(operation) || [];
    if (durations.length === 0) return null;

    durations.sort((a, b) => a - b);
    
    return {
      count: durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      avg: durations.reduce((a, b) => a + b) / durations.length,
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
    };
  }
}

// Usage in your application
const monitor = new PerformanceMonitor();

app.get('/listing', async (req, res) => {
  const timerId = monitor.startTimer('get_listing');
  
  try {
    const result = await listingService.getListings();
    const duration = monitor.endTimer(timerId);
    
    // Log slow operations
    if (duration > 100) {
      logger.warn(`Slow listing operation: ${duration}ms`);
    }
    
    res.json(result);
  } catch (error) {
    monitor.endTimer(timerId);
    throw error;
  }
});
```

## 🎓 Summary

### Quick Reference

| Task | Command | Output |
|------|---------|--------|
| **Visual JS analysis** | `npx 0x -- node app.js` | Interactive flame graph |
| **System CPU profile** | `node --prof app.js` | Detailed text report |
| **Memory analysis** | `node --inspect app.js` | Chrome DevTools |
| **Load testing** | `autocannon -c 10 -a 1000 URL` | Performance metrics |

### Key Takeaways

1. **Use both tools**: 0x for visual insights, --prof for detailed metrics
2. **Test realistically**: Use production-like load and data patterns  
3. **Focus on impact**: Optimize wide sections in flame graphs first
4. **Monitor continuously**: Integrate performance tracking in CI/CD
5. **Document findings**: Create reproducible performance reports

### Performance Goals

- **JavaScript CPU**: <15% (excellent: <10%)
- **GC overhead**: <5% (excellent: <3%)  
- **Response time**: <100ms (excellent: <50ms)
- **Cache hit ratio**: >90% (excellent: >95%)
- **Memory growth**: Stable over time

---

*This guide provides a comprehensive approach to Node.js performance analysis. Adapt the techniques based on your specific application requirements and constraints.* 