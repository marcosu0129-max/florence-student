import {
  ArrowLeft, ArrowRight, BadgeCheck, Bell, BellOff, Bookmark, BookOpen,
  ChevronRight, ChevronDown, CircleAlert, CircleHelp, Eye, EyeOff, ExternalLink, FolderOpen,
  GraduationCap, Headset, House, Info, Lightbulb, LockKeyhole, LogOut,
  Mail, Search, ShieldCheck, SlidersHorizontal, Star, Trash2, TrendingUp,
  UserRound, UsersRound, X, Scale,
} from 'lucide-react';

// Local SVGs retain their geometry before fonts load and never shrink with text.
const icons = {
  arrow_back: ArrowLeft, arrow_forward: ArrowRight, bookmark: Bookmark,
  bookmark_border: Bookmark, chevron_right: ChevronRight, expand_more: ChevronDown, close: X,
  delete: Trash2, error_outline: CircleAlert, folder_open: FolderOpen,
  groups: UsersRound, home: House, info: Info, lightbulb: Lightbulb,
  lock: LockKeyhole, logout: LogOut, mail: Mail, menu_book: BookOpen,
  notifications: Bell, notifications_none: BellOff, open_in_new: ExternalLink,
  person: UserRound, school: GraduationCap, search: Search, shield: ShieldCheck,
  star: Star, support_agent: Headset, trending_up: TrendingUp,
  tune: SlidersHorizontal, verified: BadgeCheck, visibility: Eye,
  visibility_off: EyeOff, balance: Scale,
};
export type IconName = keyof typeof icons;
interface IconProps { name: string; size?: number; filled?: boolean; className?: string; }

export default function Icon({ name, size = 20, filled = false, className }: IconProps) {
  const Glyph = icons[name as IconName] || CircleHelp;
  const solid = filled && (name === 'star' || name === 'bookmark');
  return <Glyph
    aria-hidden="true" focusable="false" data-icon={name} data-filled={filled || undefined}
    width={size} height={size} size={size}
    fill={solid ? 'currentColor' : 'none'} strokeWidth={filled && !solid ? 2.5 : 2}
    className={className}
    style={{ display: 'block', width: size, height: size, flexShrink: 0 }}
  />;
}
