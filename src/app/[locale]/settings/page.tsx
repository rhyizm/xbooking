import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server'; // Use getTranslations for Server Components
import { auth } from "@clerk/nextjs/server"; // Use Clerk server-side auth
import AccountConnections from "@/components/settings/AccountConnections";
import GoogleCalendarIntegration from "@/components/settings/GoogleCalendarIntegration";
import LineMessagingIntegration from "@/components/settings/LineMessagingIntegration";
import LineUserManager from "@/components/settings/LineUserManager";
import StripeConnectIntegration from "@/components/settings/StripeConnectIntegration";
import { SettingsCard } from '@/components/settings/SettingsCard';

export default async function SettingsPage() {
  const t = await getTranslations('settings'); // Use await with getTranslations
  const { userId } = await auth(); // Get Clerk auth

  if (!userId) {
    redirect('/signin');
  }

  // Define profile fields using translations
  const profileFields = [
    { id: 'username', label: t('profile.usernameLabel'), type: 'text', placeholder: t('profile.usernamePlaceholder') },
    { id: 'email', label: t('profile.emailLabel'), type: 'email', placeholder: t('profile.emailPlaceholder') },
  ];

  // Server action remains the same
  const handleProfileSubmit = async (values: Record<string, string>) => {
    'use server';
    console.log('Submitting profile data via Server Action:', values);

    try {
      const response = await fetch('/api/dummy/settings/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', response.status, errorData.message);
        throw new Error(`Failed to update profile: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('API Success:', result.message);

    } catch (error) {
      console.error('Error submitting profile:', error);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      <SettingsCard
        title={t('profile.title')}
        description={t('profile.description')}
        fields={profileFields}
        initialValues={{
          username: '',
          email: '',
        }}
        onSubmit={handleProfileSubmit}
        submitButtonText={t('profile.saveButton')} // Pass translated button text
      />

      <StripeConnectIntegration />

      <AccountConnections
        title={t('accountConnections.title')}
        description={t('accountConnections.description')}
        googleConnectedText={t('accountConnections.googleConnected')}
        googleConnectText={t('accountConnections.googleConnect')}
        googleDisconnectText={t('accountConnections.googleDisconnect')}
        lineConnectedText={t('accountConnections.lineConnected')}
        lineConnectText={t('accountConnections.lineConnect')}
        lineDisconnectText={t('accountConnections.lineDisconnect')}
      />

      <GoogleCalendarIntegration
        title={t('googleCalendar.title')}
        description={t('googleCalendar.description')}
        connectText={t('googleCalendar.connect')}
        disconnectText={t('googleCalendar.disconnect')}
        connectedText={t('googleCalendar.connected')}
        fetchingCalendarsText={t('googleCalendar.fetchingCalendars')}
        calendarsListText={t('googleCalendar.calendarsList')}
        errorText={t('googleCalendar.error')}
      />

      <LineMessagingIntegration
        title={t('lineMessaging.title')}
        description={t('lineMessaging.description')}
        channelIdLabel={t('lineMessaging.channelIdLabel')}
        channelSecretLabel={t('lineMessaging.channelSecretLabel')}
        channelAccessTokenLabel={t('lineMessaging.channelAccessTokenLabel')}
        webhookUrlLabel={t('lineMessaging.webhookUrlLabel')}
        saveText={t('lineMessaging.save')}
        deleteText={t('lineMessaging.delete')}
        savingText={t('lineMessaging.saving')}
        deletingText={t('lineMessaging.deleting')}
        savedText={t('lineMessaging.saved')}
        deletedText={t('lineMessaging.deleted')}
        errorText={t('lineMessaging.error')}
      />

      <LineUserManager
        title={t('lineUsers.title')}
        description={t('lineUsers.description')}
        addUserText={t('lineUsers.addUser')}
        userIdLabel={t('lineUsers.userIdLabel')}
        loadingText={t('lineUsers.loading')}
        followersText={t('lineUsers.followers')}
        noUsersText={t('lineUsers.noUsers')}
        sendTestMessageText={t('lineUsers.sendTestMessage')}
      />
    </div>
  );
}