import { nanoid } from 'nanoid';

export interface UserSlugGenerationOptions {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  slugIdLength?: number;
  existingSlugId?: string;
}

export interface SlugData {
  slug: string;
  slugId: string;
}

export class SlugGenerator {
  private static readonly DEFAULT_SLUG_ID_LENGTH = 15;
  private static readonly SLUG_SEPARATOR = '-';

  static parseSlugId(slug: string): string | null {
    if (!slug) return null;

    const parts = slug.split(this.SLUG_SEPARATOR);
    const slugId = parts[parts.length - 1];

    if (slugId && /^[a-zA-Z0-9_-]+$/.test(slugId) && slugId.length >= 10) {
      return slugId;
    }

    return null;
  }

  static isValidSlug(slug: string): boolean {
    return this.parseSlugId(slug) !== null;
  }

  static generateUserSlug(options: UserSlugGenerationOptions): SlugData {
    const {
      firstName,
      lastName,
      companyName,
      slugIdLength = this.DEFAULT_SLUG_ID_LENGTH,
      existingSlugId,
    } = options;

    const slugId = existingSlugId || nanoid(slugIdLength).replace(/-/g, '_');
    const components: string[] = [];

    if (companyName?.trim()) {
      components.push(this.normalize(companyName));
    } else {
      if (firstName?.trim()) components.push(this.normalize(firstName));
      if (lastName?.trim()) components.push(this.normalize(lastName));
    }

    if (components.length === 0) components.push('user');
    components.push(slugId);

    return { slug: components.join(this.SLUG_SEPARATOR), slugId };
  }

  static generateUserSlugFromData(
    firstName: string | null | undefined,
    lastName: string | null | undefined,
    companyName: string | null | undefined,
    slugIdLength?: number,
    existingSlugId?: string,
  ): SlugData {
    return this.generateUserSlug({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      companyName: companyName || undefined,
      slugIdLength,
      existingSlugId,
    });
  }

  private static normalize(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }
}
