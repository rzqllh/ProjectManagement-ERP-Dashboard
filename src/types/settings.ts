export interface SystemSettings {
    // Appearance
    app_name: string;
    primary_color: string;

    // Escalation Rules
    escalation_risk_days: number;
    escalation_critical_days: number;
    escalation_auto_enabled: boolean;

    // Dashboard
    dashboard_refresh_interval: number;
    dashboard_default_view: 'overview' | 'analytics';

    // ND Management
    nd_auto_number_prefix: string;
    nd_default_status: string;

    // Notifications
    notification_email_enabled: boolean;
    notification_digest_frequency: 'daily' | 'weekly' | 'off';

    // Data
    data_retention_days: number;
    export_format: 'json' | 'csv';
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    app_name: 'CANERIS ERP',
    primary_color: '#06d6a0',
    escalation_risk_days: 5,
    escalation_critical_days: 10,
    escalation_auto_enabled: true,
    dashboard_refresh_interval: 300,
    dashboard_default_view: 'overview',
    nd_auto_number_prefix: 'ND',
    nd_default_status: 'draft',
    notification_email_enabled: false,
    notification_digest_frequency: 'off',
    data_retention_days: 365,
    export_format: 'json',
};
