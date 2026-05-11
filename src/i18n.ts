import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "landing": {
        "title": "Hive Accounting",
        "subtitle": "World-class blockchain accounting for a transparent future.",
        "description": "The first decentralized accounting tool connected directly to the Hive blockchain. Secure, immutable, and fully auditable.",
        "audit_button": "Start Audit",
        "transact_button": "Manage Transactions",
        "benefits": {
          "transparency": "Total Transparency",
          "transparency_desc": "Every entry is a block on the chain, immutable and forever public.",
          "security": "Blockchain Security",
          "security_desc": "Signed with Hive Keychain, ensuring only you control your records.",
          "auditability": "Real-time Auditing",
          "audit_desc": "Public ledger allows anyone to verify financial records instantly."
        },
        "audit_input_placeholder": "Enter Hive account (e.g. vane08)",
        "audit_now": "Audit Account",
        "projects_title": "The Gold Standard for Project Transparency",
        "projects_desc": "Empower your community with radical financial clarity. Hive Accounting offers a sophisticated infrastructure for projects to exhibit their ledger with immutable, blockchain-verified proof. Build trust through open accounting."
      },
      "audit": {
        "title": "Public Audit",
        "account_ledger": "Account Ledger",
        "history_of": "Full history of",
        "on_blockchain": "on the Hive blockchain",
        "no_records": "No transactions found for this account.",
        "querying": "Querying the Hive blockchain...",
        "wait": "This may take a few seconds",
        "back": "Back to Home"
      },
      "dashboard": {
        "active_account": "Active Account",
        "new_payment": "New Payment",
        "manual_entry": "Manual Entry (via TX)",
        "tx_placeholder": "TX ID or Link",
        "register_tx": "Register TX Entry",
        "connected": "Connected",
        "hide_ledger": "Hide Ledger",
        "view_ledger": "View Ledger",
        "confirm_payment": "Confirm Payment & Record Journal"
      },
      "common": {
        "language": "Language",
        "english": "English",
        "spanish": "Spanish",
        "loading": "Loading...",
        "error": "An error occurred"
      }
    }
  },
  es: {
    translation: {
      "landing": {
        "title": "Hive Accounting",
        "subtitle": "Contabilidad blockchain de clase mundial para un futuro transparente.",
        "description": "La primera herramienta de contabilidad descentralizada conectada directamente a la blockchain de Hive. Segura, inmutable y totalmente auditable.",
        "audit_button": "Iniciar Auditoría",
        "transact_button": "Gestionar Transacciones",
        "benefits": {
          "transparency": "Transparencia Total",
          "transparency_desc": "Cada asiento es un bloque en la cadena, inmutable y público para siempre.",
          "security": "Seguridad Blockchain",
          "security_desc": "Firmado con Hive Keychain, asegurando que solo tú controlas tus registros.",
          "auditability": "Auditoría en Tiempo Real",
          "audit_desc": "El libro mayor público permite a cualquiera verificar registros financieros al instante."
        },
        "audit_input_placeholder": "Ingresa cuenta de Hive (ej. vane08)",
        "audit_now": "Realizar Auditoría",
        "projects_title": "El Estándar de Oro para la Transparencia de Proyectos",
        "projects_desc": "Empodera a tu comunidad con una claridad financiera radical. Hive Accounting ofrece una infraestructura sofisticada para que los proyectos exhiban su libro mayor con pruebas inmutables y verificadas por la blockchain. Construye confianza a través de una contabilidad abierta."
      },
      "audit": {
        "title": "Auditoría Pública",
        "account_ledger": "Libro Contable",
        "history_of": "Historial completo de",
        "on_blockchain": "en la blockchain de Hive",
        "no_records": "No se encontraron transacciones para esta cuenta.",
        "querying": "Consultando la blockchain de Hive...",
        "wait": "Esto puede tardar unos segundos",
        "back": "Volver al Inicio"
      },
      "dashboard": {
        "active_account": "Cuenta Activa",
        "new_payment": "Nuevo Pago",
        "manual_entry": "Asiento Manual (vía TX)",
        "tx_placeholder": "ID de TX o Enlace",
        "register_tx": "Registrar Asiento TX",
        "connected": "Conectado",
        "hide_ledger": "Ocultar Libro",
        "view_ledger": "Ver Libro",
        "confirm_payment": "Confirmar Pago y Registrar Asiento"
      },
      "common": {
        "language": "Idioma",
        "english": "Inglés",
        "spanish": "Español",
        "loading": "Cargando...",
        "error": "Ocurrió un error"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
