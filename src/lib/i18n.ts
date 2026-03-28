export type Locale = 'en' | 'ar'

const translations: Record<string, Record<Locale, string>> = {
  // Navigation
  'nav.dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
  'nav.events': { en: 'Events', ar: 'الفعاليات' },
  'nav.tasks': { en: 'Tasks', ar: 'المهام' },
  'nav.calendar': { en: 'Calendar', ar: 'التقويم' },
  'nav.clients': { en: 'Clients', ar: 'العملاء' },
  'nav.vendors': { en: 'Vendors', ar: 'الموردون' },
  'nav.speakers': { en: 'Speakers', ar: 'المتحدثون' },
  'nav.exhibitors': { en: 'Exhibitors', ar: 'العارضون' },
  'nav.documents': { en: 'Documents', ar: 'المستندات' },
  'nav.reports': { en: 'Reports', ar: 'التقارير' },
  'nav.approvals': { en: 'Approvals', ar: 'الموافقات' },
  'nav.teams': { en: 'Teams', ar: 'الفرق' },
  'nav.timesheets': { en: 'Timesheets', ar: 'سجل الدوام' },
  'nav.settings': { en: 'Settings', ar: 'الإعدادات' },
  'nav.users': { en: 'Users', ar: 'المستخدمون' },

  // Common actions
  'action.create': { en: 'Create', ar: 'إنشاء' },
  'action.edit': { en: 'Edit', ar: 'تعديل' },
  'action.delete': { en: 'Delete', ar: 'حذف' },
  'action.save': { en: 'Save', ar: 'حفظ' },
  'action.cancel': { en: 'Cancel', ar: 'إلغاء' },
  'action.search': { en: 'Search', ar: 'بحث' },
  'action.filter': { en: 'Filter', ar: 'تصفية' },
  'action.export': { en: 'Export', ar: 'تصدير' },
  'action.import': { en: 'Import', ar: 'استيراد' },
  'action.submit': { en: 'Submit', ar: 'إرسال' },
  'action.approve': { en: 'Approve', ar: 'موافقة' },
  'action.reject': { en: 'Reject', ar: 'رفض' },
  'action.close': { en: 'Close', ar: 'إغلاق' },
  'action.back': { en: 'Back', ar: 'رجوع' },
  'action.next': { en: 'Next', ar: 'التالي' },
  'action.view_all': { en: 'View All', ar: 'عرض الكل' },
  'action.add_new': { en: 'Add New', ar: 'إضافة جديد' },
  'action.upload': { en: 'Upload', ar: 'رفع' },
  'action.download': { en: 'Download', ar: 'تحميل' },

  // Status labels
  'status.active': { en: 'Active', ar: 'نشط' },
  'status.inactive': { en: 'Inactive', ar: 'غير نشط' },
  'status.draft': { en: 'Draft', ar: 'مسودة' },
  'status.pending': { en: 'Pending', ar: 'قيد الانتظار' },
  'status.approved': { en: 'Approved', ar: 'تمت الموافقة' },
  'status.rejected': { en: 'Rejected', ar: 'مرفوض' },
  'status.completed': { en: 'Completed', ar: 'مكتمل' },
  'status.in_progress': { en: 'In Progress', ar: 'قيد التنفيذ' },
  'status.cancelled': { en: 'Cancelled', ar: 'ملغي' },
  'status.overdue': { en: 'Overdue', ar: 'متأخر' },
  'status.todo': { en: 'To Do', ar: 'للتنفيذ' },
  'status.blocked': { en: 'Blocked', ar: 'محظور' },
  'status.on_hold': { en: 'On Hold', ar: 'معلق' },

  // Dashboard
  'dashboard.title': { en: 'Dashboard', ar: 'لوحة التحكم' },
  'dashboard.total_events': { en: 'Total Events', ar: 'إجمالي الفعاليات' },
  'dashboard.active_events': { en: 'Active Events', ar: 'الفعاليات النشطة' },
  'dashboard.pending_tasks': { en: 'Pending Tasks', ar: 'المهام المعلقة' },
  'dashboard.overdue_tasks': { en: 'Overdue Tasks', ar: 'المهام المتأخرة' },
  'dashboard.recent_activity': { en: 'Recent Activity', ar: 'النشاط الأخير' },
  'dashboard.upcoming_events': { en: 'Upcoming Events', ar: 'الفعاليات القادمة' },
  'dashboard.my_tasks': { en: 'My Tasks', ar: 'مهامي' },

  // Events
  'events.title': { en: 'Events', ar: 'الفعاليات' },
  'events.new_event': { en: 'New Event', ar: 'فعالية جديدة' },
  'events.event_name': { en: 'Event Name', ar: 'اسم الفعالية' },
  'events.start_date': { en: 'Start Date', ar: 'تاريخ البداية' },
  'events.end_date': { en: 'End Date', ar: 'تاريخ النهاية' },
  'events.venue': { en: 'Venue', ar: 'المكان' },
  'events.budget': { en: 'Budget', ar: 'الميزانية' },
  'events.type': { en: 'Type', ar: 'النوع' },
  'events.client': { en: 'Client', ar: 'العميل' },

  // Tasks
  'tasks.title': { en: 'Tasks', ar: 'المهام' },
  'tasks.new_task': { en: 'New Task', ar: 'مهمة جديدة' },
  'tasks.assigned_to': { en: 'Assigned To', ar: 'مسند إلى' },
  'tasks.due_date': { en: 'Due Date', ar: 'تاريخ الاستحقاق' },
  'tasks.priority': { en: 'Priority', ar: 'الأولوية' },

  // Common labels
  'label.name': { en: 'Name', ar: 'الاسم' },
  'label.email': { en: 'Email', ar: 'البريد الإلكتروني' },
  'label.phone': { en: 'Phone', ar: 'الهاتف' },
  'label.status': { en: 'Status', ar: 'الحالة' },
  'label.date': { en: 'Date', ar: 'التاريخ' },
  'label.description': { en: 'Description', ar: 'الوصف' },
  'label.notes': { en: 'Notes', ar: 'ملاحظات' },
  'label.total': { en: 'Total', ar: 'الإجمالي' },
  'label.amount': { en: 'Amount', ar: 'المبلغ' },
  'label.actions': { en: 'Actions', ar: 'الإجراءات' },
  'label.no_data': { en: 'No data available', ar: 'لا توجد بيانات' },
  'label.loading': { en: 'Loading...', ar: 'جاري التحميل...' },
  'label.welcome': { en: 'Welcome', ar: 'مرحباً' },
  'label.logout': { en: 'Logout', ar: 'تسجيل الخروج' },
  'label.profile': { en: 'Profile', ar: 'الملف الشخصي' },
  'label.notifications': { en: 'Notifications', ar: 'الإشعارات' },

  // Auth
  'auth.login': { en: 'Sign In', ar: 'تسجيل الدخول' },
  'auth.email': { en: 'Email Address', ar: 'البريد الإلكتروني' },
  'auth.password': { en: 'Password', ar: 'كلمة المرور' },
  'auth.forgot_password': { en: 'Forgot Password?', ar: 'نسيت كلمة المرور؟' },
  'auth.reset_password': { en: 'Reset Password', ar: 'إعادة تعيين كلمة المرور' },

  // Reports
  'reports.title': { en: 'Reports', ar: 'التقارير' },
  'reports.portfolio': { en: 'Portfolio Overview', ar: 'نظرة عامة على المحفظة' },
  'reports.event_detail': { en: 'Event Detail', ar: 'تفاصيل الفعالية' },
  'reports.utilization': { en: 'Utilization', ar: 'الاستخدام' },

  // Timesheets
  'timesheets.title': { en: 'Timesheets', ar: 'سجل الدوام' },
  'timesheets.this_week': { en: 'This Week', ar: 'هذا الأسبوع' },
  'timesheets.total_hours': { en: 'Total Hours', ar: 'إجمالي الساعات' },
  'timesheets.submit_week': { en: 'Submit Week', ar: 'إرسال الأسبوع' },
}

export function t(key: string, locale: Locale = 'en'): string {
  return translations[key]?.[locale] || key
}

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}
