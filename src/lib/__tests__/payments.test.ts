import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentsAPI } from '../api-tickets-zones';
import { supabase } from '../supabase';

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(),
        })),
        order: vi.fn(),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  },
}));

// Mock auth service
vi.mock('../auth', () => ({
  authService: {
    getCurrentUser: vi.fn(() => ({ id: 'user-1', email: 'test@example.com' })),
  },
}));

describe('paymentsAPI.createWithExcess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create payment for exact amount', async () => {
    // Mock data
    const mockInvoice = {
      id: 'inv-1',
      amount: 100,
      amount_paid: 0,
      balance: 100,
      status: 'pending',
    };

    const mockPayment = {
      id: 'pay-1',
      amount: 100,
      invoice_id: 'inv-1',
    };

    // Setup mocks
    const mockSelect = vi.fn();
    const mockInsert = vi.fn();
    const mockUpdate = vi.fn();

    mockSelect.mockResolvedValueOnce({ data: mockInvoice, error: null });
    mockInsert.mockResolvedValueOnce({ data: mockPayment, error: null });
    mockUpdate.mockResolvedValueOnce({ error: null });

    supabase.from = vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: vi.fn(() => ({
        single: mockSelect,
        select: mockUpdate,
      })),
    }));

    const result = await paymentsAPI.createWithExcess(
      'client-1',
      'inv-1',
      100,
      'cash',
      'ref-123'
    );

    expect(result.success).toBe(true);
    expect(result.totalApplied).toBe(100);
    expect(result.remainingAmount).toBe(0);
  });

  it('should handle payment with excess and apply to next invoice', async () => {
    // Mock current invoice (fully paid)
    const mockCurrentInvoice = {
      id: 'inv-1',
      amount: 50,
      amount_paid: 0,
      balance: 50,
    };

    // Mock next invoice
    const mockNextInvoice = {
      id: 'inv-2',
      amount: 50,
      amount_paid: 0,
      balance: 50,
    };

    const mockPayments = [
      { id: 'pay-1', amount: 50 },
      { id: 'pay-2', amount: 30 },
    ];

    // Setup mocks
    const mockSelect = vi.fn();
    const mockInsert = vi.fn();
    const mockUpdate = vi.fn();

    mockSelect
      .mockResolvedValueOnce({ data: mockCurrentInvoice, error: null }) // Current invoice
      .mockResolvedValueOnce({ data: [mockNextInvoice], error: null }); // Pending invoices

    mockInsert
      .mockResolvedValueOnce({ data: mockPayments[0], error: null })
      .mockResolvedValueOnce({ data: mockPayments[1], error: null });

    mockUpdate.mockResolvedValue({ error: null });

    supabase.from = vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: vi.fn(() => ({
        single: mockSelect,
        select: mockUpdate,
      })),
      in: vi.fn(() => ({
        order: mockSelect,
      })),
    }));

    const result = await paymentsAPI.createWithExcess(
      'client-1',
      'inv-1',
      80, // Pay 80, 50 for current + 30 for next
      'cash'
    );

    expect(result.success).toBe(true);
    expect(result.totalApplied).toBe(80);
    expect(result.remainingAmount).toBe(0);
  });

  it('should throw error for already paid invoice', async () => {
    const mockInvoice = {
      id: 'inv-1',
      amount: 100,
      amount_paid: 100,
      balance: 0,
    };

    supabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockInvoice, error: null }),
        })),
      })),
    }));

    await expect(
      paymentsAPI.createWithExcess('client-1', 'inv-1', 50, 'cash')
    ).rejects.toThrow('La factura ya está completamente pagada');
  });

  it('should handle missing credit_balance column gracefully', async () => {
    const mockInvoice = {
      id: 'inv-1',
      amount: 100,
      amount_paid: 0,
      balance: 100,
    };

    const mockPayment = { id: 'pay-1', amount: 100 };

    // Setup mocks
    const mockSelect = vi.fn();
    const mockInsert = vi.fn();

    mockSelect
      .mockResolvedValueOnce({ data: mockInvoice, error: null }) // Current invoice
      .mockResolvedValueOnce({ data: null, error: { code: '42703' } }); // Client with missing column

    mockInsert.mockResolvedValueOnce({ data: mockPayment, error: null });

    supabase.from = vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: vi.fn(() => ({ eq: vi.fn() })),
      eq: vi.fn(() => ({
        single: mockSelect,
      })),
      in: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    }));

    await expect(
      paymentsAPI.createWithExcess('client-1', 'inv-1', 120, 'cash')
    ).rejects.toThrow('La columna "credit_balance" no existe');
  });
});