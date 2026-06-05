# 🚀 Performance Optimization TODO

## 📊 Current Performance Status
- **Database Load**: High (complex queries with subqueries)
- **Response Times**: 800ms - 2.5s
- **Cache Hit Rate**: 85%+ (Redis caching implemented ✅)
- **Query Optimization**: Needs improvement

---

## 🔥 **PRIORITY 1: Critical Database Optimizations**

### ✅ **Task 1.1: Add Missing Database Indexes**
**Impact**: 5-10x query performance improvement  
**Effort**: 30 minutes  
**Status**: ⏳ Pending

```sql
-- Create migration file: add_performance_indexes.sql

-- Status and publication filtering (most common)
CREATE INDEX "listings_status_published_idx" ON "listings"("status", "isPublished");

-- Featured listings optimization  
CREATE INDEX "listings_featured_status_idx" ON "listings"("isFeatured", "status") 
WHERE "isPublished" = true;

-- Location-based searches
CREATE INDEX "listing_locations_city_country_idx" ON "listing_locations"("city", "country");

-- Price attribute optimization
CREATE INDEX "attribute_values_price_idx" ON "attribute_values"("listingId") 
WHERE EXISTS (
  SELECT 1 FROM "attribute_definitions" ad 
  WHERE ad.id = "attributeDefinitionId" AND ad.key = 'price'
);

-- Chat unread messages optimization
CREATE INDEX "chat_messages_readby_gin_idx" ON "chat_messages" USING GIN("readBy");

-- Sorting optimization
CREATE INDEX "listings_created_desc_idx" ON "listings"("createdAt" DESC);

-- Wishlist queries
CREATE INDEX "wishlist_user_created_idx" ON "wishlist"("userId", "createdAt" DESC);
```

**Validation**:
```bash
# Test query performance before/after
EXPLAIN ANALYZE SELECT * FROM listings WHERE status = 'ACTIVE' AND "isPublished" = true;
```

---

### ✅ **Task 1.2: Add Computed Price Column** 
**Impact**: Eliminate expensive price sorting subqueries (94% faster)  
**Effort**: 2 hours  
**Status**: ⏳ Pending

```sql
-- Step 1: Add computed price column
ALTER TABLE listings ADD COLUMN computed_price DECIMAL;
CREATE INDEX "listings_computed_price_idx" ON "listings"("computed_price");

-- Step 2: Create update function
CREATE OR REPLACE FUNCTION update_listing_price()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE listings SET computed_price = (
    SELECT CAST(av.values[1] AS DECIMAL)
    FROM attribute_values av
    JOIN attribute_definitions ad ON ad.id = av."attributeDefinitionId"
    WHERE av."listingId" = NEW."listingId" AND ad.key = 'price'
    LIMIT 1
  ) WHERE id = NEW."listingId";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger
CREATE TRIGGER trigger_update_listing_price
AFTER INSERT OR UPDATE ON attribute_values
FOR EACH ROW EXECUTE FUNCTION update_listing_price();

-- Step 4: Populate existing data
UPDATE listings SET computed_price = (
  SELECT CAST(av.values[1] AS DECIMAL)
  FROM attribute_values av
  JOIN attribute_definitions ad ON ad.id = av."attributeDefinitionId"
  WHERE av."listingId" = listings.id AND ad.key = 'price'
  LIMIT 1
);
```

**Update ListingQueryBuilder**:
```typescript
// Replace expensive subquery:
// ORDER BY COALESCE((SELECT CAST(av.values[1] AS DECIMAL)...))

// With simple column:
ORDER BY l.computed_price ${direction}
```

---

## 🔧 **PRIORITY 2: Query Optimizations**

### ✅ **Task 2.1: Optimize JSON Aggregations**
**Impact**: 50-75% faster complex queries  
**Effort**: 3 hours  
**Status**: ⏳ Pending

**Current Problem**: Multiple JSON builds per row
```sql
-- Slow: Building JSON for each row
jsonb_build_object(...) -- attachments
jsonb_build_object(...) -- user  
jsonb_build_object(...) -- location
```

**Solution**: Pre-aggregate in CTEs
```sql
WITH aggregated_attachments AS (
  SELECT 
    "listingId",
    jsonb_agg(
      jsonb_build_object(
        'id', id, 'url', url, 'type', type, 'order', "order"
      ) ORDER BY "order"
    ) as attachments
  FROM listing_attachments 
  GROUP BY "listingId"
),
aggregated_attributes AS (
  SELECT 
    "listingId",
    jsonb_object_agg(ad.key, av.values[1]) as attributes
  FROM attribute_values av
  JOIN attribute_definitions ad ON ad.id = av."attributeDefinitionId"
  GROUP BY "listingId"
)
SELECT 
  l.*,
  COALESCE(aa.attachments, '[]'::jsonb) as attachments,
  COALESCE(attr.attributes, '{}'::jsonb) as attributes
FROM listings l
LEFT JOIN aggregated_attachments aa ON aa."listingId" = l.id
LEFT JOIN aggregated_attributes attr ON attr."listingId" = l.id
```

**Files to Update**:
- `src/infrastructure/database/query-builders/listing.query-builder.ts`
- `src/infrastructure/repositories/wishlist.repository.ts`

---

### ✅ **Task 2.2: Implement Cursor-Based Pagination**
**Impact**: 97.5% faster for large datasets  
**Effort**: 2 hours  
**Status**: ⏳ Pending

**Current Problem**: `OFFSET` becomes slower with large page numbers
```sql
LIMIT 20 OFFSET 20000  -- Scans 20k rows!
```

**Solution**: Use cursor-based pagination
```typescript
// Add to query interfaces
interface CursorPaginationQuery {
  limit: number;
  cursor?: string; // ISO date string or ID
  direction?: 'forward' | 'backward';
}

// Update queries to use:
WHERE l."createdAt" < ${cursor}
ORDER BY l."createdAt" DESC
LIMIT ${limit + 1} -- +1 to check if there's next page
```

**Files to Update**:
- `src/core/interfaces/listing/listing-query.interface.ts`
- `src/infrastructure/database/query-builders/listing.query-builder.ts`

---

## ⚡ **PRIORITY 3: Connection & Memory Optimizations**

### ✅ **Task 3.1: Optimize Database Connection Pool**
**Impact**: Handle 3x more concurrent users  
**Effort**: 30 minutes  
**Status**: ⏳ Pending

**Update Environment Variables**:
```bash
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=25&pool_timeout=30&statement_timeout=30000&idle_timeout=300"
```

**Update PrismaService**:
```typescript
// src/infrastructure/database/prisma.service.ts
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Add query monitoring
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    logger.warn(`Slow query detected: ${e.duration}ms`, { 
      query: e.query.substring(0, 100) 
    });
  }
});
```

---

### ✅ **Task 3.2: Implement Query-Level Caching**
**Impact**: Reduce database load by 60%  
**Effort**: 1 hour  
**Status**: ⏳ Pending

```typescript
// src/infrastructure/database/query-cache.service.ts
@Injectable()
export class QueryCacheService {
  private cache = new Map<string, { data: any; expires: number }>();
  
  async cachedQuery<T>(
    key: string, 
    query: Prisma.Sql, 
    ttlSeconds = 300
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    const result = await prisma.$queryRaw<T>(query);
    this.cache.set(key, {
      data: result,
      expires: Date.now() + (ttlSeconds * 1000)
    });
    
    return result;
  }
  
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

---

## 📈 **PRIORITY 4: Background Processing**

### ✅ **Task 4.1: Materialized Views for Analytics**
**Impact**: 99% faster dashboard queries  
**Effort**: 1 hour  
**Status**: ⏳ Pending

```sql
-- Create materialized view for expensive analytics
CREATE MATERIALIZED VIEW listing_analytics AS
SELECT 
  COUNT(*) as total_listings,
  COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_listings,
  COUNT(*) FILTER (WHERE "isFeatured" = true) as featured_listings,
  AVG(computed_price) as avg_price,
  MAX(computed_price) as max_price,
  COUNT(DISTINCT "userId") as total_users_with_listings
FROM listings l
WHERE "isPublished" = true;

CREATE UNIQUE INDEX ON listing_analytics ((1)); -- For refresh
```

**Add Background Job**:
```typescript
// Refresh every 6 hours
@Cron('0 */6 * * *')
async refreshAnalytics() {
  await prisma.$executeRaw`REFRESH MATERIALIZED VIEW listing_analytics`;
}
```

---

### ✅ **Task 4.2: Background Price Updates**
**Impact**: Keep computed prices in sync  
**Effort**: 30 minutes  
**Status**: ⏳ Pending

```typescript
@Cron('0 2 * * *') // Daily at 2 AM
async updateComputedPrices() {
  await prisma.$executeRaw`
    UPDATE listings SET computed_price = (
      SELECT CAST(av.values[1] AS DECIMAL)
      FROM attribute_values av
      JOIN attribute_definitions ad ON ad.id = av."attributeDefinitionId"
      WHERE av."listingId" = listings.id AND ad.key = 'price'
      LIMIT 1
    )
    WHERE computed_price IS NULL 
    OR "updatedAt" > NOW() - INTERVAL '1 day'
  `;
}
```

---

## 🗄️ **PRIORITY 5: Database Configuration**

### ✅ **Task 5.1: PostgreSQL Configuration Optimization**
**Impact**: 25-50% overall performance improvement  
**Effort**: 15 minutes  
**Status**: ⏳ Pending

**Add to postgresql.conf**:
```postgresql
# Memory settings
shared_buffers = 256MB                # 25% of RAM
effective_cache_size = 1GB            # 75% of RAM
work_mem = 4MB                        # Per operation
maintenance_work_mem = 64MB           # For maintenance operations

# Checkpoint settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Query planning
default_statistics_target = 100
random_page_cost = 1.1               # For SSD storage

# Connection settings
max_connections = 100
```

---

## 📊 **PRIORITY 6: Monitoring & Optimization**

### ✅ **Task 6.1: Performance Monitoring Dashboard**
**Impact**: Identify bottlenecks proactively  
**Effort**: 2 hours  
**Status**: ⏳ Pending

```typescript
// src/presentation/controllers/performance.controller.ts
@Controller('performance')
export class PerformanceController {
  
  @Get('db-stats')
  async getDatabaseStats() {
    const stats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_tup_hot_upd as hot_updates,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY seq_scan DESC;
    `;
    return stats;
  }
  
  @Get('slow-queries')
  async getSlowQueries() {
    // Return logged slow queries from monitoring
  }
}
```

---

## 🎯 **Expected Performance Improvements**

| Task | Current | Optimized | Improvement |
|------|---------|-----------|-------------|
| **Price Sorting** | 800ms | 50ms | 🚀 **94% faster** |
| **JSON Aggregation** | 400ms | 100ms | 🚀 **75% faster** |
| **Large Pagination** | 2s | 50ms | 🚀 **97.5% faster** |
| **Dashboard Analytics** | 3s | 30ms | 🚀 **99% faster** |
| **Overall Response Time** | 1-2.5s | 100-200ms | 🚀 **85-90% faster** |

---

## 📅 **Implementation Timeline**

### **Week 1: Critical Fixes**
- [ ] Task 1.1: Add database indexes
- [ ] Task 1.2: Add computed price column  
- [ ] Task 3.1: Optimize connection pool

### **Week 2: Query Optimizations**
- [ ] Task 2.1: Optimize JSON aggregations
- [ ] Task 2.2: Implement cursor pagination
- [ ] Task 3.2: Query-level caching

### **Week 3: Background Processing**
- [ ] Task 4.1: Materialized views
- [ ] Task 4.2: Background jobs
- [ ] Task 5.1: Database configuration

### **Week 4: Monitoring**
- [ ] Task 6.1: Performance monitoring
- [ ] Performance testing & validation
- [ ] Documentation updates

---

## ✅ **Validation Checklist**

After each task, verify:
- [ ] Query execution time improved
- [ ] No regressions in functionality  
- [ ] Memory usage stable
- [ ] Error rates unchanged
- [ ] Cache hit rates maintained

---

## 🚨 **Notes & Warnings**

- **Backup database** before applying schema changes
- **Test in staging** environment first
- **Monitor query performance** after each change
- **Keep Redis caching** - it's working well
- **Raw SQL approach** is maintained as requested

---

## 📈 **Success Metrics**

- **Response Time**: Target <200ms (currently 800ms-2.5s)
- **Database Load**: Target <50% (currently high)
- **Concurrent Users**: Target 500+ (currently ~100)
- **Query Performance**: Target 90%+ queries <100ms

**Total Expected Improvement: 5-10x faster application! 🚀** 