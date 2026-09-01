import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type AchievementGroupId = 'getting_started' | 'tiers' | 'mastery' | 'performance' | 'career';

export interface AchievementGroup {
  id: AchievementGroupId;
  label: string;
  eyebrow: string;
}

export const ACHIEVEMENT_GROUPS: readonly AchievementGroup[] = [
  { id: 'getting_started', label: 'Başlangıç', eyebrow: 'OTURUM KAYITLARI' },
  { id: 'tiers', label: 'Kademeler', eyebrow: 'ERİŞİM HATTI' },
  { id: 'mastery', label: 'Alan Hakimiyeti', eyebrow: 'KAPSAMA KAYITLARI' },
  { id: 'performance', label: 'Performans', eyebrow: 'DOĞRULUK VE DENGE' },
  { id: 'career', label: 'Rütbe', eyebrow: 'KARİYER EŞİKLERİ' },
] as const;

export interface AchievementDefinition {
  id: string;
  group: AchievementGroupId;
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
}

export const ACHIEVEMENTS = [
  { id: 'first_session', group: 'getting_started', icon: 'play-circle-outline', title: 'İlk Oturum', description: 'İlk 10 soruluk oturumunu tamamla.' },
  { id: 'first_correct', group: 'getting_started', icon: 'checkmark-circle-outline', title: 'İlk Doğru', description: 'İlk doğru cevabını ver.' },
  { id: 'comeback_session', group: 'getting_started', icon: 'refresh-circle-outline', title: 'Devam Eden', description: 'Toplam 5 oturum tamamla.' },

  { id: 'first_medium_unlock', group: 'tiers', icon: 'layers-outline', title: 'Orta Kademe', description: 'Herhangi bir alanda Orta kademeyi aç.' },
  { id: 'first_hard_unlock', group: 'tiers', icon: 'flame-outline', title: 'Zor Kademe', description: 'Herhangi bir alanda Zor kademeyi aç.' },
  { id: 'all_medium_unlocked', group: 'tiers', icon: 'grid-outline', title: 'Orta Hat Açıldı', description: 'Tüm alanlarda Orta kademeyi aç.' },
  { id: 'all_hard_unlocked', group: 'tiers', icon: 'git-network-outline', title: 'Zor Hat Açıldı', description: 'Tüm alanlarda Zor kademeyi aç.' },

  { id: 'web_easy_complete', group: 'mastery', icon: 'code-slash-outline', title: 'Web Temeli', description: 'Web Programlama Kolay kademesinde 20/20 ilerlemeye ulaş.' },
  { id: 'os_easy_complete', group: 'mastery', icon: 'hardware-chip-outline', title: 'Sistem Temeli', description: 'İşletim Sistemleri Kolay kademesinde 20/20 ilerlemeye ulaş.' },
  { id: 'db_easy_complete', group: 'mastery', icon: 'server-outline', title: 'Veri Temeli', description: 'Veritabanı Sistemleri Kolay kademesinde 20/20 ilerlemeye ulaş.' },
  { id: 'web_mastery', group: 'mastery', icon: 'terminal-outline', title: 'Web Hakimiyeti', description: 'Web Programlama alanındaki 6 kademe yeterliliğini geç.' },
  { id: 'os_mastery', group: 'mastery', icon: 'settings-outline', title: 'Sistem Hakimiyeti', description: 'İşletim Sistemleri alanındaki 6 kademe yeterliliğini geç.' },
  { id: 'db_mastery', group: 'mastery', icon: 'analytics-outline', title: 'Veri Hakimiyeti', description: 'Veritabanı Sistemleri alanındaki 6 kademe yeterliliğini geç.' },
  { id: 'full_coverage', group: 'mastery', icon: 'scan-circle-outline', title: 'Tam Kapsama', description: 'Üç alandaki 18 kademe yeterliliğinin tamamını geç.' },

  { id: 'hundred_correct', group: 'performance', icon: 'checkmark-done-outline', title: '100 Doğru', description: 'Toplam 100 doğru cevap ver.' },
  { id: 'balanced_operator', group: 'performance', icon: 'pulse-outline', title: 'Dengeli İlerleme', description: 'Her alanda en az 20 soru ilerleme kazan.' },
  { id: 'advanced_operator', group: 'performance', icon: 'rocket-outline', title: 'İleri Seviye', description: 'Her alanda en az 40 soru ilerleme kazan.' },

  { id: 'team_lead_rank', group: 'career', icon: 'people-outline', title: 'Takım Lideri', description: 'Takım Lideri rütbesine ulaş.' },
  { id: 'cto_rank', group: 'career', icon: 'diamond-outline', title: 'CTO Yolu', description: 'CTO rütbe hattına ulaş.' },
] as const satisfies readonly AchievementDefinition[];

export type AchievementId = typeof ACHIEVEMENTS[number]['id'];
