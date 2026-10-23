import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiGet } from './client'

function stubFetch(response: Partial<Response>) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
}

afterEach(() => vi.unstubAllGlobals())

describe('apiGet', () => {
  it('returns parsed JSON and drops undefined query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: 1 }) })
    vi.stubGlobal('fetch', fetchMock)
    await expect(apiGet('/x', { a: 1, b: undefined })).resolves.toEqual({ ok: 1 })
    expect(fetchMock).toHaveBeenCalledWith('/api/x?a=1')
  })

  it('throws a typed ApiError carrying the status and detail', async () => {
    stubFetch({ ok: false, status: 422, json: async () => ({ detail: 'bad mode' }) })
    const error = await apiGet('/x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 422, message: 'bad mode' })
  })

  it('falls back to a generic message for non-JSON errors', async () => {
    stubFetch({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json')
      },
    })
    await expect(apiGet('/x')).rejects.toMatchObject({
      status: 500,
      message: 'Request failed (500)',
    })
  })
})
