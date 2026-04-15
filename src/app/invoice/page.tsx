"use client";

import { useEffect, useState } from "react";
import { InvoicePageView } from "@/components/invoice/InvoicePageView";
import { InvoiceScaffold } from "@/components/invoice/InvoiceScaffold";
import { AuthLoadingScreen } from "@/features/auth/AuthLoadingScreen";
import { AuthLoginScreen } from "@/features/auth/AuthLoginScreen";
import { useAuth } from "@/features/auth/useAuth";
import { getInitialLocale, persistLocale, type AppLocale } from "@/lib/locale";
import { fetchCustomerProfiles, fetchInvoices, type CustomerProfile, type InvoiceRecord } from "@/lib/supabase";

// cspell:ignore supabase

export default function InvoicePage() {
  const { authState, email, setEmail, password, setPassword, authError, profile, handleSignIn, handleSignOut } = useAuth();

  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [activeLocale, setActiveLocale] = useState<AppLocale>(() => getInitialLocale());

  useEffect(() => {
    let isMounted = true;

    const loadPageData = async () => {
      const [customersResult, invoicesResult] = await Promise.allSettled([fetchCustomerProfiles(), fetchInvoices()]);
      if (!isMounted) return;

      setCustomers(customersResult.status === "fulfilled" ? customersResult.value : []);
      setInvoices(invoicesResult.status === "fulfilled" ? invoicesResult.value : []);
    };

    void loadPageData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleLocale = () => {
    setActiveLocale((prev) => {
      const next = prev === "zh" ? "en" : "zh";
      persistLocale(next);
      return next;
    });
  };

  if (authState === "loading") return <AuthLoadingScreen />;

  if (authState !== "authed") {
    return (
      <AuthLoginScreen
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        authError={authError}
        onSignIn={handleSignIn}
      />
    );
  }

  return (
    <InvoiceScaffold
      profileName={profile?.full_name ?? undefined}
      profileEmail={profile?.email || email}
      profileRole={profile?.role ?? undefined}
      activeLocale={activeLocale}
      onToggleLocale={handleToggleLocale}
      onSignOut={handleSignOut}
    >
      <InvoicePageView
        presetItems={[]}
        recentQuotations={[]}
        invoiceRows={invoices}
        customerProfilesFromDb={customers}
        activeLocale={activeLocale}
        showBuilderSection={false}
        showListSection
        showQuotationTab={false}
        onRequestInvoicesRefresh={async () => {
          const next = await fetchInvoices();
          setInvoices(next);
        }}
      />
    </InvoiceScaffold>
  );
}
