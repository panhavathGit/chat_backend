import { prisma } from '@config/database.js';
import { Gallery } from '@generated/prisma/client.js';
import { BANNER_STATUSES } from '@shared/constants/banner.constants.js';

export class BannerRepository {
  /**
   * Find all active banners
   */
  async findActiveBanners(): Promise<Gallery[]> {
    return prisma.gallery.findMany({
      where: {
        status: BANNER_STATUSES.ACTIVE,
      },
      orderBy: [{ id: 'desc' }],
    });
  }

  // * ─── Admin methods ──────────────────────────────────────────────────────────

  /**
   * Find all banners regardless of status (admin)
   */
  async findAll(): Promise<Gallery[]> {
    return prisma.gallery.findMany({ orderBy: [{ id: 'desc' }] });
  }

  /**
   * Find a single banner by ID (admin)
   */
  async findById(id: number): Promise<Gallery | null> {
    return prisma.gallery.findUnique({ where: { id } });
  }

  /**
   * Create a new banner
   */
  async create(data: {
    file?: string;
    name?: string;
    type?: string;
    link?: string;
    status?: string;
  }): Promise<Gallery> {
    return prisma.gallery.create({ data });
  }

  /**
   * Update an existing banner
   */
  async update(
    id: number,
    data: {
      file?: string;
      name?: string;
      type?: string;
      link?: string;
      status?: string;
    }
  ): Promise<Gallery> {
    return prisma.gallery.update({ where: { id }, data });
  }

  /**
   * Update only the status of a banner
   */
  async updateStatus(id: number, status: string): Promise<Gallery> {
    return prisma.gallery.update({ where: { id }, data: { status } });
  }

  /**
   * Delete a banner by ID
   */
  async deleteById(id: number): Promise<Gallery> {
    return prisma.gallery.delete({ where: { id } });
  }
}
