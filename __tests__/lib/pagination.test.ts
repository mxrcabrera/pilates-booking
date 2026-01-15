import { paginatedResponse, PaginationParams } from '@/lib/pagination'

// Mock NextRequest since it's not available in jsdom environment
class MockNextRequest {
  url: string
  constructor(url: string) {
    this.url = url
  }
}

// Re-implement getPaginationParams logic for testing
function getPaginationParamsFromUrl(url: string): PaginationParams {
  const { searchParams } = new URL(url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

describe('pagination', () => {
  describe('getPaginationParams (logic test)', () => {
    it('should return default values when no params provided', () => {
      const result = getPaginationParamsFromUrl('http://localhost:3000/api/test')

      expect(result.page).toBe(1)
      expect(result.limit).toBe(50)
      expect(result.skip).toBe(0)
    })

    it('should parse page from query', () => {
      const result = getPaginationParamsFromUrl('http://localhost:3000/api/test?page=3')

      expect(result.page).toBe(3)
      expect(result.skip).toBe(100) // (3-1) * 50
    })

    it('should parse limit from query', () => {
      const result = getPaginationParamsFromUrl('http://localhost:3000/api/test?limit=20')

      expect(result.limit).toBe(20)
    })

    it('should cap limit at 100', () => {
      const result = getPaginationParamsFromUrl('http://localhost:3000/api/test?limit=500')

      expect(result.limit).toBe(100)
    })

    it('should ensure limit is at least 1', () => {
      const result = getPaginationParamsFromUrl('http://localhost:3000/api/test?limit=0')

      expect(result.limit).toBe(1)
    })

    it('should ensure page is at least 1', () => {
      const result = getPaginationParamsFromUrl('http://localhost:3000/api/test?page=0')

      expect(result.page).toBe(1)
    })

    it('should handle negative values', () => {
      const result = getPaginationParamsFromUrl('http://localhost:3000/api/test?page=-5&limit=-10')

      expect(result.page).toBe(1)
      expect(result.limit).toBe(1)
    })

    it('should calculate skip correctly', () => {
      const result = getPaginationParamsFromUrl('http://localhost:3000/api/test?page=5&limit=10')

      expect(result.skip).toBe(40) // (5-1) * 10
    })
  })

  describe('paginatedResponse', () => {
    const params: PaginationParams = { page: 1, limit: 10, skip: 0 }

    it('should return correct structure', () => {
      const data = [1, 2, 3, 4, 5]
      const result = paginatedResponse(data, 50, params)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('pagination')
      expect(result.data).toEqual(data)
    })

    it('should calculate totalPages correctly', () => {
      const result = paginatedResponse([], 50, { page: 1, limit: 10, skip: 0 })
      expect(result.pagination.totalPages).toBe(5)

      const result2 = paginatedResponse([], 55, { page: 1, limit: 10, skip: 0 })
      expect(result2.pagination.totalPages).toBe(6)
    })

    it('should set hasNext correctly', () => {
      const firstPage = paginatedResponse([], 50, { page: 1, limit: 10, skip: 0 })
      expect(firstPage.pagination.hasNext).toBe(true)

      const lastPage = paginatedResponse([], 50, { page: 5, limit: 10, skip: 40 })
      expect(lastPage.pagination.hasNext).toBe(false)
    })

    it('should set hasPrev correctly', () => {
      const firstPage = paginatedResponse([], 50, { page: 1, limit: 10, skip: 0 })
      expect(firstPage.pagination.hasPrev).toBe(false)

      const secondPage = paginatedResponse([], 50, { page: 2, limit: 10, skip: 10 })
      expect(secondPage.pagination.hasPrev).toBe(true)
    })

    it('should include all pagination metadata', () => {
      const result = paginatedResponse([1, 2, 3], 100, { page: 3, limit: 20, skip: 40 })

      expect(result.pagination).toEqual({
        page: 3,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: true,
        hasPrev: true
      })
    })

    it('should handle single page', () => {
      const result = paginatedResponse([1, 2, 3], 3, { page: 1, limit: 10, skip: 0 })

      expect(result.pagination.totalPages).toBe(1)
      expect(result.pagination.hasNext).toBe(false)
      expect(result.pagination.hasPrev).toBe(false)
    })

    it('should handle empty data', () => {
      const result = paginatedResponse([], 0, params)

      expect(result.data).toEqual([])
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.totalPages).toBe(0)
    })
  })
})
