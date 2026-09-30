import { apiGet, apiPut } from "./api";

export interface AccountSettings {
  enableCustomerEmailForCreditPayment: boolean;
  enableWeeklyCreditReport: boolean;
  enableCustomer: boolean;
  onlyAdmin: boolean;
  configureEmail: boolean;
  enableMonthlyCreditReport: boolean;
}

export interface Account {
  id?: string;

  accountName: string;
  phone: string;
  logoUrl: string; // Base64 image

  billingStreet: string;
  billingCity: string;
  postalCode: string;
  state: string;
  country: string;

  settings: AccountSettings;
}

/*
|--------------------------------------------------------------------------
| Backend GET response
|--------------------------------------------------------------------------
*/

interface AccountApiData {
  id: string;
  accountName: string;
  phone: string | null;
  logoUrl: string | null;

  billingStreet: string | null;
  billingCity: string | null;
  billingPostalCode: string | null;
  billingState: string | null;
  billingCountry: string | null;

  enableCustomerEmail: boolean;
  enableWeeklyCreditReport: boolean;
  enableMonthlyCreditReport: boolean;

  enableCustomer?: boolean;
  onlyAdmin?: boolean;
  configureEmail?: boolean;
}

interface AccountApiResponse {
  success: boolean;
  data: AccountApiData;
}

/*
|--------------------------------------------------------------------------
| GET ACCOUNT
| GET /api/v1/account
|--------------------------------------------------------------------------
*/

export const getAccount = async (): Promise<Account> => {
  const response =
    await apiGet<AccountApiResponse>("/account");

  const data = response.data;

  return {
    id: data.id,

    accountName:
      data.accountName ?? "",

    phone:
      data.phone ?? "",

    logoUrl:
      data.logoUrl ?? "",

    billingStreet:
      data.billingStreet ?? "",

    billingCity:
      data.billingCity ?? "",

    postalCode:
      data.billingPostalCode ?? "",

    state:
      data.billingState ?? "",

    country:
      data.billingCountry ?? "",

    settings: {
      enableCustomerEmailForCreditPayment:
        data.enableCustomerEmail ??
        false,

      enableWeeklyCreditReport:
        data.enableWeeklyCreditReport ??
        false,

      enableCustomer:
        data.enableCustomer ??
        false,

      onlyAdmin:
        data.onlyAdmin ??
        false,

      configureEmail:
        data.configureEmail ??
        false,

      enableMonthlyCreditReport:
        data.enableMonthlyCreditReport ??
        false,
    },
  };
};

/*
|--------------------------------------------------------------------------
| UPDATE ACCOUNT
| PUT /api/v1/account
|--------------------------------------------------------------------------
*/

interface UpdateAccountResponse {
  success: boolean;
  data: AccountApiData;
}

export const updateAccount = async (
  account: Account
): Promise<Account> => {

  const payload = {
    accountName: account.accountName,
    phone: account.phone,

    logoUrl:
      account.logoUrl || null,

    billingStreet:
      account.billingStreet || null,

    billingCity:
      account.billingCity || null,

    billingPostalCode:
      account.postalCode || null,

    billingState:
      account.state || null,

    billingCountry:
      account.country || null,

    enableCustomerEmail:
      account.settings
        .enableCustomerEmailForCreditPayment,

    enableWeeklyCreditReport:
      account.settings
        .enableWeeklyCreditReport,

    enableMonthlyCreditReport:
      account.settings
        .enableMonthlyCreditReport,

    enableCustomer:
      account.settings
        .enableCustomer,

    onlyAdmin:
      account.settings
        .onlyAdmin,

    configureEmail:
      account.settings
        .configureEmail,
  };

  const response =
    await apiPut<
      UpdateAccountResponse,
      typeof payload
    >(
      "/account",
      payload
    );

  const data = response.data;

  return {
    id: data.id,

    accountName:
      data.accountName ?? "",

    phone:
      data.phone ?? "",

    logoUrl:
      data.logoUrl ?? "",

    billingStreet:
      data.billingStreet ?? "",

    billingCity:
      data.billingCity ?? "",

    postalCode:
      data.billingPostalCode ?? "",

    state:
      data.billingState ?? "",

    country:
      data.billingCountry ?? "",

    settings: {
      enableCustomerEmailForCreditPayment:
        data.enableCustomerEmail ??
        false,

      enableWeeklyCreditReport:
        data.enableWeeklyCreditReport ??
        false,

      enableCustomer:
        data.enableCustomer ??
        false,

      onlyAdmin:
        data.onlyAdmin ??
        false,

      configureEmail:
        data.configureEmail ??
        false,

      enableMonthlyCreditReport:
        data.enableMonthlyCreditReport ??
        false,
    },
  };
};