/**
 * NOVA HOUSE Admin Portal · Hotel Configuration & System Settings Service
 * Synchronizes hotel identity, policies, booking rules, and announcements with Supabase (public.hotel_config).
 */

import { getSupabase } from './supabase';

export interface HotelConfigData {
  hotelName: string;
  tagline: string;
  location?: string;
  contactEmail: string;
  phone: string;
  currency: string;
  timezone: string;
  checkInTime: string;
  checkOutTime: string;
  minStayNights?: number;
  maxStayNights?: number;
  cancellationNoticeHours: number;
  cancellationPolicy?: string;
  taxPercentage?: number;
  specialAnnouncement?: string;
  instantConfirmation?: boolean;
  notifications?: Record<string, boolean>;
  security?: {
    twoFactorEnabled: boolean;
    sessionTimeoutMins: number;
  };
}

export const DEFAULT_HOTEL_SETTINGS: HotelConfigData = {
  hotelName: 'NOVA HOUSE',
  tagline: 'A Place To Pause',
  location: 'Richmond Town, Bengaluru, India',
  contactEmail: 'gm@novahouse.example',
  phone: '+91 80 4965 8800',
  currency: 'INR (₹)',
  timezone: 'Asia/Kolkata (IST +5:30)',
  checkInTime: '02:00 PM',
  checkOutTime: '12:00 PM',
  minStayNights: 1,
  maxStayNights: 30,
  cancellationNoticeHours: 48,
  cancellationPolicy: 'Full refund up to 48 hours prior to check-in. 50% refund within 24-48 hours.',
  taxPercentage: 18,
  specialAnnouncement: 'Welcome to NOVA HOUSE. Experience our open charcoal hearth at EMBER.',
  instantConfirmation: true,
  notifications: {
    emailOnNewBooking: true,
    smsOnCheckIn: true,
    enquiryAlerts: true,
    dailyFinancialDigest: true,
  },
  security: {
    twoFactorEnabled: true,
    sessionTimeoutMins: 60,
  },
};

const STORAGE_KEY = 'nova_admin_hotel_settings';

export async function getHotelSettings(): Promise<HotelConfigData> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('hotel_config')
        .select('*')
        .eq('key', 'hotel_info')
        .single();

      if (!error && data && data.data) {
        const d = data.data;
        const mapped: HotelConfigData = {
          hotelName: d.name || d.hotelName || DEFAULT_HOTEL_SETTINGS.hotelName,
          tagline: d.tagline || DEFAULT_HOTEL_SETTINGS.tagline,
          location: d.location || DEFAULT_HOTEL_SETTINGS.location,
          contactEmail: d.email || d.contactEmail || DEFAULT_HOTEL_SETTINGS.contactEmail,
          phone: d.phone || DEFAULT_HOTEL_SETTINGS.phone,
          currency: d.currency || DEFAULT_HOTEL_SETTINGS.currency,
          timezone: d.timezone || DEFAULT_HOTEL_SETTINGS.timezone,
          checkInTime: d.checkInTime || DEFAULT_HOTEL_SETTINGS.checkInTime,
          checkOutTime: d.checkOutTime || DEFAULT_HOTEL_SETTINGS.checkOutTime,
          minStayNights: d.minStayNights ?? DEFAULT_HOTEL_SETTINGS.minStayNights,
          maxStayNights: d.maxStayNights ?? DEFAULT_HOTEL_SETTINGS.maxStayNights,
          cancellationNoticeHours: d.cancellationNoticeHours ?? DEFAULT_HOTEL_SETTINGS.cancellationNoticeHours,
          cancellationPolicy: d.cancellationPolicy || DEFAULT_HOTEL_SETTINGS.cancellationPolicy,
          taxPercentage: d.taxPercentage ?? DEFAULT_HOTEL_SETTINGS.taxPercentage,
          specialAnnouncement: d.specialAnnouncement || DEFAULT_HOTEL_SETTINGS.specialAnnouncement,
          instantConfirmation: d.instantConfirmation ?? DEFAULT_HOTEL_SETTINGS.instantConfirmation,
          notifications: d.notifications || DEFAULT_HOTEL_SETTINGS.notifications,
          security: d.security || DEFAULT_HOTEL_SETTINGS.security,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.warn('Failed to retrieve hotel settings from Supabase:', e);
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_HOTEL_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {}

  return DEFAULT_HOTEL_SETTINGS;
}

export async function saveHotelSettings(partial: Partial<HotelConfigData>): Promise<HotelConfigData> {
  const current = await getHotelSettings();
  const updated: HotelConfigData = {
    ...current,
    ...partial,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  const sb = getSupabase();
  if (sb) {
    try {
      // Keep DB format compatible with both customer and admin apps
      const dbPayload = {
        name: updated.hotelName,
        hotelName: updated.hotelName,
        tagline: updated.tagline,
        location: updated.location,
        email: updated.contactEmail,
        contactEmail: updated.contactEmail,
        phone: updated.phone,
        currency: updated.currency,
        timezone: updated.timezone,
        checkInTime: updated.checkInTime,
        checkOutTime: updated.checkOutTime,
        minStayNights: updated.minStayNights,
        maxStayNights: updated.maxStayNights,
        cancellationNoticeHours: updated.cancellationNoticeHours,
        cancellationPolicy: updated.cancellationPolicy,
        taxPercentage: updated.taxPercentage,
        specialAnnouncement: updated.specialAnnouncement,
        instantConfirmation: updated.instantConfirmation,
        notifications: updated.notifications,
        security: updated.security,
      };

      await sb.from('hotel_config').upsert([
        {
          key: 'hotel_info',
          data: dbPayload,
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.warn('Failed to persist hotel settings to Supabase:', e);
    }
  }

  return updated;
}
