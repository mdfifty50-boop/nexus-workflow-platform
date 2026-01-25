# Phase 2: Performance Tasks

## Pre-Planned Tasks (Skip Party Mode)

### High Priority (model: sonnet)
1. Implement React.lazy() for route-based code splitting
2. Add Anthropic prompt caching for AI calls
3. Implement model tiering (Haiku/Sonnet/Opus)
4. Add skeleton loading screens
5. Optimize bundle size with tree shaking

### Medium Priority (model: sonnet)
6. Add image lazy loading
7. Implement virtual scrolling for long lists
8. Add service worker for caching
9. Optimize database queries
10. Add response compression

### Lower Priority (model: haiku)
11. Add performance monitoring hooks
12. Create Lighthouse audit script
13. Document performance best practices
14. Add bundle analyzer to build
15. Configure CDN caching headers

## Validation Criteria
- [ ] Initial bundle < 200KB gzipped
- [ ] LCP < 2.5s on 3G
- [ ] Code splitting working on routes
- [ ] Prompt caching reducing API costs
- [ ] No render-blocking resources
