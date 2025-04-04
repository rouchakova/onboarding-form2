import React, { useState, useEffect } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';
import { supabase } from './lib/supabaseClient';

interface FormData {
  environments: string[];
  formats: string[];
  operationType: string;
  resoldInventoryProportion?: string;
  sellerCategories: {
    ownedAndOperated: string[];
    intermediary: string[];
  };
  childDirectedPortion: string;
  appStores: string[];
  otherAppStores?: string;
  
  businessName: string;
  businessDomain: string;
  hasSellersJson: boolean;
  sellersJsonUrl?: string;
  intermediaryInfo: {
    handlesPayments: boolean;
    supportsSupplyChain: boolean;
    inventoryProportion: string;
    canSegmentInventory: boolean;
  };
  appCtvInfo: {
    displaysThirdPartyContent: boolean;
    hasContentConsent: boolean;
  };
  supplementalContentLink?: string;
  supplementalInfo?: string;
  
  // Section 3: WEB Technical Info
  webTechnical: {
    integrationMethods: string[];
    preferredIntegration: string;
    videoPlayer: string;
    pricingStrategy: {
      implementing: boolean;
      vendor?: string;
      integrationUsing?: string;
      sovrnOptimization?: boolean;
    };
    requestVolume: {
      display: string;
      video: string;
    };
    trafficPercentage: {
      display: {
        northAmerica: string;
        emea: string;
        apac: string;
        latam: string;
      };
      video: {
        northAmerica: string;
        emea: string;
        apac: string;
        latam: string;
      };
    };
    dataCenters: string[];
    pmpData: string;
    sensitiveCategories: string[];
    adServerPlatforms: string[];
    headerBiddingType: string;
    timeoutSettings: string;
  };
  
  // Section 4: oRTB Technical
  ortbTechnical: {
    impressionTracking: string[];
    videoImpressionTracking: string;
    adCallFlow: {
      impressionEvent: string;
      impressionSide: string;
      impressionTiming: string;
      bidCaching: string;
      tmaxControl: string;
    };
    adQuality: {
      conductScanning: boolean;
      scanningPartner: string;
      scanningRate: string;
      payloadLimitations: string;
    };
    utcReporting: boolean;
    ortbRequirements: {
      version: string;
      platform: string;
      documentation: string;
      extraFields: string;
      supportsAccountId: boolean;
      supportsGzip: boolean;
      supportsTagId: boolean;
    };
    cookieMatching: {
      canHostTable: boolean;
      tableUrl: string;
      canInitiateSync: boolean;
      requiresDataPoints: boolean;
      macros: string;
      supportsConsent: boolean;
      matchRate: string;
      supportsEids: boolean;
      eidsTypes: string[];
    };
  };

  // Section 5: CTV/APP Technical Info
  ctvAppTechnical: {
    integrationMethods: string[];
    preferredIntegration: string;
    requestVolume: {
      ctv: string;
      inApp: string;
    };
    trafficPercentage: {
      inApp: {
        northAmerica: string;
        emea: string;
        apac: string;
        latam: string;
      };
      ctv: {
        northAmerica: string;
        emea: string;
        apac: string;
        latam: string;
      };
    };
    dataCenters: string[];
    pmpData: string;
    sensitiveCategories: string[];
    
    // Section 6: Technical Settings
    technicalSettings: {
      impressionTracking: string[];
      mobileAppTracking: {
        burlTiming: string;
        interstitialTracking: string;
        additionalInfo: string;
      };
      networking: {
        threePidSupport: string;
        skAdNetworkSupport: boolean;
        adPodsSupport: boolean;
      };
      adQuality: {
        qualityVendors: string;
      };
      ortbRequirements: {
        multiImpressionSupport: boolean;
        multiFormatSupport: boolean;
        multiBidSupport: boolean;
        demographicDataSupport: boolean;
        contentObjectSupport: boolean;
        impressionExpiryWindow: string;
        maxTimeout: boolean;
      };
      inventoryManagement: {
        requiresMapping: boolean;
        mappingGranularity: string;
        hasRevenueCaps: boolean;
        revenueCapsDetails: string;
      };
    };
    adServerPlatforms: string[];
    sdkVersions: string;
    appFramework: string;
  };

  name: string;
  email: string;
}

type FormSection = 'generic' | 'web' | 'ctvapp';

// Remove these duplicate type definitions
type Region = 'northAmerica' | 'emea' | 'apac' | 'latam';
type AdCallFlowField = 'impressionEvent' | 'impressionSide' | 'impressionTiming' | 'bidCaching' | 'tmaxControl';
type AdQualityField = 'scanningPartner' | 'scanningRate' | 'payloadLimitations';

// oRTB Requirements types
type OrtbRequirementsTextFields = 'version' | 'platform' | 'documentation' | 'extraFields';
type OrtbRequirementsBooleanFields = 'supportsAccountId' | 'supportsGzip' | 'supportsTagId';
type OrtbRequirementsField = OrtbRequirementsTextFields | OrtbRequirementsBooleanFields;

// Cookie Matching types
type CookieMatchingTextFields = 'tableUrl' | 'macros' | 'matchRate';
type CookieMatchingBooleanFields = 'canHostTable' | 'canInitiateSync' | 'requiresDataPoints' | 'supportsConsent' | 'supportsEids';
type CookieMatchingField = CookieMatchingTextFields | CookieMatchingBooleanFields;

// Add this type for the form submission status
type SubmissionStatus = 'draft' | 'submitted';

// Add these helper functions near the top of your component
const hasWebOptions = (formData: FormData): boolean => {
  return formData.environments.includes('WEB') || 
         formData.formats.includes('Display') ||
         formData.formats.includes('Video') ||
         formData.formats.includes('Interstitial - WEB') ||
         formData.formats.includes('Native - WEB');
};

const hasCtvAppOptions = (formData: FormData): boolean => {
  return formData.environments.includes('Mobile In-App') ||
         formData.environments.includes('Desktop In-App') ||
         formData.environments.includes('CTV/OTT') ||
         formData.formats.includes('Interstitial - APP') ||
         formData.formats.includes('Native - APP');
};

// Add this function near your other functions but before the App component
const calculateProgress = (formData: FormData, webRequired: boolean, ctvAppRequired: boolean): number => {
  let totalFields = 0;
  let filledFields = 0;

  // Generic section required fields
  const genericRequired = [
    formData.name !== '',                    // Name
    formData.email !== '',                   // Email
    formData.businessName !== '',            // Business Name
    formData.businessDomain !== '',          // Business Domain
    formData.hasSellersJson !== undefined,   // Sellers.json question
    formData.operationType !== '',           // Operation Type
    formData.environments.length > 0,        // Environments
    formData.formats.length > 0,             // Formats
    formData.sellerCategories.ownedAndOperated.length > 0 || 
    formData.sellerCategories.intermediary.length > 0,  // Seller Categories
    formData.childDirectedPortion !== ''     // COPPA Regulation
  ];

  // Web Technical section required fields (only if Web is selected)
  const webFields = webRequired ? [
    formData.webTechnical.integrationMethods.length > 0,
    formData.webTechnical.preferredIntegration !== '',
    formData.webTechnical.requestVolume.display !== '' || formData.webTechnical.requestVolume.video !== '',
    Object.values(formData.webTechnical.trafficPercentage.display).some(v => v !== '') ||
    Object.values(formData.webTechnical.trafficPercentage.video).some(v => v !== ''),
    formData.webTechnical.dataCenters.length > 0
  ] : [];

  // CTV/APP Technical section required fields (only if CTV/APP is selected)
  const ctvFields = ctvAppRequired ? [
    formData.ctvAppTechnical.integrationMethods.length > 0,
    formData.ctvAppTechnical.preferredIntegration !== '',
    formData.ctvAppTechnical.requestVolume.ctv !== '' || formData.ctvAppTechnical.requestVolume.inApp !== '',
    Object.values(formData.ctvAppTechnical.trafficPercentage.inApp).some(v => v !== '') ||
    Object.values(formData.ctvAppTechnical.trafficPercentage.ctv).some(v => v !== ''),
    formData.ctvAppTechnical.dataCenters.length > 0
  ] : [];

  // Add conditional fields
  if (formData.hasSellersJson) {
    genericRequired.push(formData.sellersJsonUrl !== '');
  }
  
  if (isAppRelated(formData)) {
    genericRequired.push(formData.appStores.length > 0);
  }

  // Calculate totals
  totalFields = genericRequired.length + 
                (webRequired ? webFields.length : 0) + 
                (ctvAppRequired ? ctvFields.length : 0);
  
  filledFields = genericRequired.filter(Boolean).length +
                 webFields.filter(Boolean).length +
                 ctvFields.filter(Boolean).length;

  // Calculate percentage and ensure it's between 0 and 100
  const percentage = Math.round((filledFields / totalFields) * 100);
  return Math.min(Math.max(percentage, 0), 100);
};

// Add this component at the top of your file, before the App component
const RequiredIndicator = () => (
  <span className="text-red-500 ml-1" title="This field is required">*</span>
);

// First, add helper functions to check dependencies
const isIntermediarySelected = (formData: FormData): boolean => {
  return formData.sellerCategories.intermediary.length > 0;
};

const isAppRelated = (formData: FormData): boolean => {
  return formData.environments.includes('Mobile In-App') ||
         formData.environments.includes('Desktop In-App') ||
         formData.formats.includes('Interstitial - APP') ||
         formData.formats.includes('Native - APP');
};

// Update or add these helper functions
const isWebRelated = (formData: FormData): boolean => {
  return formData.environments.includes('WEB') ||
         formData.formats.includes('Display') ||
         formData.formats.includes('Video') ||
         formData.formats.includes('Interstitial - WEB') ||
         formData.formats.includes('Native - WEB');
};

const isCtvAppRelated = (formData: FormData): boolean => {
  return formData.environments.includes('Mobile In-App') ||
         formData.environments.includes('Desktop In-App') ||
         formData.environments.includes('CTV/OTT') ||
         formData.formats.includes('Interstitial - APP') ||
         formData.formats.includes('Native - APP');
};

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<FormSection>('generic');
  const [formData, setFormData] = useState<FormData>({
    environments: [],
    formats: [],
    operationType: '',
    resoldInventoryProportion: '',
    sellerCategories: {
      ownedAndOperated: [],
      intermediary: []
    },
    childDirectedPortion: '',
    appStores: [],
    otherAppStores: '',
    businessName: '',
    businessDomain: '',
    hasSellersJson: false,
    intermediaryInfo: {
      handlesPayments: false,
      supportsSupplyChain: false,
      inventoryProportion: '',
      canSegmentInventory: false
    },
    appCtvInfo: {
      displaysThirdPartyContent: false,
      hasContentConsent: false
    },
    supplementalContentLink: '',
    supplementalInfo: '',
    
    // Section 3: WEB Technical Info
    webTechnical: {
      integrationMethods: [],
      preferredIntegration: '',
      videoPlayer: '',
      pricingStrategy: {
        implementing: false,
        vendor: '',
        integrationUsing: '',
        sovrnOptimization: false
      },
      requestVolume: {
        display: '',
        video: ''
      },
      trafficPercentage: {
        display: {
          northAmerica: '',
          emea: '',
          apac: '',
          latam: ''
        },
        video: {
          northAmerica: '',
          emea: '',
          apac: '',
          latam: ''
        }
      },
      dataCenters: [],
      pmpData: '',
      sensitiveCategories: [],
      adServerPlatforms: [],
      headerBiddingType: '',
      timeoutSettings: ''
    },
    
    // Section 4: oRTB Technical
    ortbTechnical: {
      impressionTracking: [],
      videoImpressionTracking: '',
      adCallFlow: {
        impressionEvent: '',
        impressionSide: '',
        impressionTiming: '',
        bidCaching: '',
        tmaxControl: ''
      },
      adQuality: {
        conductScanning: false,
        scanningPartner: '',
        scanningRate: '',
        payloadLimitations: ''
      },
      utcReporting: false,
      ortbRequirements: {
        version: '',
        platform: '',
        documentation: '',
        extraFields: '',
        supportsAccountId: false,
        supportsGzip: false,
        supportsTagId: false
      },
      cookieMatching: {
        canHostTable: false,
        tableUrl: '',
        canInitiateSync: false,
        requiresDataPoints: false,
        macros: '',
        supportsConsent: false,
        matchRate: '',
        supportsEids: false,
        eidsTypes: []
      }
    },

    // Section 5: CTV/APP Technical Info
    ctvAppTechnical: {
      integrationMethods: [],
      preferredIntegration: '',
      requestVolume: {
        ctv: '',
        inApp: ''
      },
      trafficPercentage: {
        inApp: {
          northAmerica: '',
          emea: '',
          apac: '',
          latam: ''
        },
        ctv: {
          northAmerica: '',
          emea: '',
          apac: '',
          latam: ''
        },
      },
      dataCenters: [],
      pmpData: '',
      sensitiveCategories: [],
      
      // Section 6: Technical Settings
      technicalSettings: {
        impressionTracking: [],
        mobileAppTracking: {
          burlTiming: '',
          interstitialTracking: '',
          additionalInfo: '',
        },
        networking: {
          threePidSupport: '',
          skAdNetworkSupport: false,
          adPodsSupport: false,
        },
        adQuality: {
          qualityVendors: '',
        },
        ortbRequirements: {
          multiImpressionSupport: false,
          multiFormatSupport: false,
          multiBidSupport: false,
          demographicDataSupport: false,
          contentObjectSupport: false,
          impressionExpiryWindow: '',
          maxTimeout: false,
        },
        inventoryManagement: {
          requiresMapping: false,
          mappingGranularity: '',
          hasRevenueCaps: false,
          revenueCapsDetails: '',
        },
      },
      adServerPlatforms: [],
      sdkVersions: '',
      appFramework: ''
    },

    name: '',
    email: ''
  });

  // Add these state variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add this to track progress
  const [progress, setProgress] = useState<number>(0);

  // Update progress whenever form data changes
  useEffect(() => {
    const webRequired = isWebRelated(formData);
    const ctvAppRequired = isCtvAppRelated(formData);
    const newProgress = calculateProgress(formData, webRequired, ctvAppRequired);
    setProgress(newProgress);
  }, [formData]); // Add formData as a dependency

  // Replace the existing saveFormData function with this one:
  const saveFormData = async (status: SubmissionStatus = 'draft') => {
    if (status === 'submitted') {
      if (!validateGenericSection()) {
        alert('Please complete all required fields in the Generic section');
        setActiveSection('generic');
        return;
      }

      if (isWebRelated(formData) && !validateWebSection()) {
        alert('Please complete all required fields in the WEB Technical Info section');
        setActiveSection('web');
        return;
      }

      if (isCtvAppRelated(formData) && !validateCtvAppSection()) {
        alert('Please complete all required fields in the CTV/APP Technical Info section');
        setActiveSection('ctvapp');
        return;
      }
    }

    setLoading(true);
    try {
      const formPayload = {
        form_data: formData,
        status: status,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('forms')
        .insert([formPayload])
        .select()
        .single();

      if (error) throw error;

      if (status === 'submitted') {
        alert('Form submitted successfully!');
      } else {
        alert('Progress saved! You can return to complete the form later.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      alert('Error saving form: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (
    field: keyof Pick<FormData, 'environments' | 'formats' | 'appStores'>,
    value: string
  ) => {
    setFormData(prev => {
      const newFormData = {
      ...prev,
      [field]: prev[field].includes(value)
          ? (prev[field] as string[]).filter(item => item !== value)
          : [...(prev[field] as string[]), value]
      };

      // Check if Web or CTV/APP sections are required
      const webRequired = hasWebOptions(newFormData);
      const ctvAppRequired = hasCtvAppOptions(newFormData);

      // Update progress calculation based on new requirements
      const newProgress = calculateProgress(newFormData, webRequired, ctvAppRequired);
      setProgress(newProgress);

      return newFormData;
    });
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSellerCategoryChange = (
    categoryGroup: keyof FormData['sellerCategories'],
    category: string
  ) => {
    setFormData(prev => ({
      ...prev,
      sellerCategories: {
        ...prev.sellerCategories,
        [categoryGroup]: prev.sellerCategories[categoryGroup].includes(category)
          ? prev.sellerCategories[categoryGroup].filter(item => item !== category)
          : [...prev.sellerCategories[categoryGroup], category]
      }
    }));
  };

  const handleWebTechnicalCheckbox = (
    field: keyof Pick<FormData['webTechnical'], 'integrationMethods' | 'dataCenters' | 'sensitiveCategories'>,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      webTechnical: {
        ...prev.webTechnical,
        [field]: prev.webTechnical[field].includes(value)
          ? (prev.webTechnical[field] as string[]).filter(item => item !== value)
          : [...(prev.webTechnical[field] as string[]), value]
      }
    }));
  };

  const handleWebTechnicalChange = (field: keyof FormData['webTechnical'], value: string) => {
    setFormData(prev => ({
      ...prev,
      webTechnical: {
        ...prev.webTechnical,
        [field]: value
      }
    }));
  };

  const handlePricingStrategyChange = (implementing: boolean) => {
    setFormData(prev => ({
      ...prev,
      webTechnical: {
        ...prev.webTechnical,
        pricingStrategy: {
          ...prev.webTechnical.pricingStrategy,
          implementing
        }
      }
    }));
  };

  const handlePricingStrategyDetailChange = (
    field: keyof FormData['webTechnical']['pricingStrategy'],
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      webTechnical: {
        ...prev.webTechnical,
        pricingStrategy: {
          ...prev.webTechnical.pricingStrategy,
          [field]: value
        }
      }
    }));
  };

  const handleCtvAppCheckbox = (
    field: keyof Pick<FormData['ctvAppTechnical'], 'integrationMethods' | 'dataCenters' | 'sensitiveCategories'>,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      ctvAppTechnical: {
        ...prev.ctvAppTechnical,
        [field]: prev.ctvAppTechnical[field].includes(value)
          ? (prev.ctvAppTechnical[field] as string[]).filter(item => item !== value)
          : [...(prev.ctvAppTechnical[field] as string[]), value]
      }
    }));
  };

  const handleCtvAppChange = (field: keyof FormData['ctvAppTechnical'], value: string) => {
    setFormData(prev => ({
      ...prev,
      ctvAppTechnical: {
        ...prev.ctvAppTechnical,
        [field]: value
      }
    }));
  };

  const handleCtvAppVolumeChange = (field: keyof FormData['ctvAppTechnical']['requestVolume'], value: string) => {
    setFormData(prev => ({
      ...prev,
      ctvAppTechnical: {
        ...prev.ctvAppTechnical,
        requestVolume: {
          ...prev.ctvAppTechnical.requestVolume,
          [field]: value
        }
      }
    }));
  };

  const handleCtvAppTrafficChange = (field: keyof FormData['ctvAppTechnical']['trafficPercentage'], region: Region, value: string) => {
    setFormData(prev => ({
      ...prev,
      ctvAppTechnical: {
        ...prev.ctvAppTechnical,
        trafficPercentage: {
          ...prev.ctvAppTechnical.trafficPercentage,
          [field]: {
            ...prev.ctvAppTechnical.trafficPercentage[field],
            [region]: value
          }
        }
      }
    }));
  };

  const handleTechnicalSettingsCheckbox = (
    field: 'impressionTracking',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      ctvAppTechnical: {
        ...prev.ctvAppTechnical,
        technicalSettings: {
          ...prev.ctvAppTechnical.technicalSettings,
          [field]: prev.ctvAppTechnical.technicalSettings[field].includes(value)
            ? prev.ctvAppTechnical.technicalSettings[field].filter(item => item !== value)
            : [...prev.ctvAppTechnical.technicalSettings[field], value]
        }
      }
    }));
  };

  // Add this near the top of your component
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .limit(1);

        if (error) {
          console.error('Supabase Error:', error.message);
        } else {
          console.log('Supabase Connected! Data:', data);
        }
      } catch (err) {
        console.error('Connection Error:', err);
      }
    };

    testConnection();
  }, []);

  const renderFormSection = () => {
    switch (activeSection) {
      case 'generic':
        return (
          <div className="space-y-6">
            {/* Add mandatory field key at the top */}
            <div className="text-sm text-gray-500 mb-4">
              <span className="text-red-500">*</span> Indicates a required field
            </div>

            <h2 className="text-xl font-bold">Sellers Information</h2>
            
            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                  <RequiredIndicator />
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                  <RequiredIndicator />
                </label>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Existing business name and domain fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Name
                  <RequiredIndicator />
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Domain
                  <RequiredIndicator />
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                  value={formData.businessDomain}
                  onChange={(e) => handleInputChange('businessDomain', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Sellers.json */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                1.a. Do you host a sellers.json file?
                <RequiredIndicator />
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="sellers-json-yes"
                    name="sellers-json"
                    className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300"
                    checked={formData.hasSellersJson === true}
                    onChange={() => setFormData(prev => ({
                      ...prev,
                      hasSellersJson: true
                    }))}
                    required
                  />
                  <label htmlFor="sellers-json-yes" className="ml-2 text-sm text-gray-600">Yes</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="sellers-json-no"
                    name="sellers-json"
                    className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300"
                    checked={formData.hasSellersJson === false}
                    onChange={() => setFormData(prev => ({
                      ...prev,
                      hasSellersJson: false,
                      sellersJsonUrl: '' // Clear the URL when switching to No
                    }))}
                  />
                  <label htmlFor="sellers-json-no" className="ml-2 text-sm text-gray-600">No</label>
                </div>
              </div>
              
              {formData.hasSellersJson && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Please provide the URL for your JSON file
                    <RequiredIndicator />
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                    value={formData.sellersJsonUrl}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sellersJsonUrl: e.target.value
                    }))}
                    required
                  />
                </div>
              )}
            </div>

            {/* Operation Type */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                1.b. Please select your Operation Type
                <RequiredIndicator />
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                value={formData.operationType}
                onChange={(e) => handleInputChange('operationType', e.target.value)}
                required
              >
                <option value="">Select an option</option>
                <option value="O&O">O&O</option>
                <option value="Intermediary">Intermediary</option>
                <option value="Both">Both</option>
              </select>

              {formData.operationType === 'Both' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Please provide a rough estimate of the proportion of resold Inventory:
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                    value={formData.resoldInventoryProportion}
                    onChange={(e) => handleInputChange('resoldInventoryProportion', e.target.value)}
                  >
                    <option value="">Select proportion</option>
                    <option value="0-25">0-25%</option>
                    <option value="26-50">26-50%</option>
                    <option value="51-75">51-75%</option>
                    <option value="76-100">76-100%</option>
              </select>
            </div>
              )}

              {/* Important Note Box */}
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Important Notes:</strong><br />
                  • Sovrn will only be accepting Intermediary CTV inventory that has direct app-ads.txt authorization from the application owner<br />
                  • Sovrn will only be accepting in-app traffic that is 4 hops or less<br />
                  • Sovrn requires that all direct OOH traffic is set to Device Type 8; all Indirect OOH traffic must adhere to the updated oRTB OOH spec
                </p>
              </div>
            </div>

            <h2 className="text-xl font-bold mt-8">Inventory Mix</h2>

            {/* Environments */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                2.a. Please select all Environments in which you operate
                <RequiredIndicator />
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'WEB',
                  'Mobile In-App',
                  'Desktop In-App',
                  'CTV/OTT'
                ].map((environment) => (
                  <div key={environment} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.environments.includes(environment)}
                      onChange={(e) => handleCheckboxChange('environments', environment)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{environment}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Formats */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                2.b. Please select all formats in which you operate:
                <RequiredIndicator />
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'Display',
                  'Video',
                  'Interstitial - WEB',
                  'Native - WEB',
                  'Interstitial - APP',
                  'Native - APP'
                ].map((format) => (
                  <div key={format} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.formats.includes(format)}
                      onChange={(e) => handleCheckboxChange('formats', format)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{format}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Seller Categories */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                1.e. Which category of seller best suits your offering?
                <RequiredIndicator />
              </label>
              
            <div className="space-y-4">
                <h3 className="font-medium">Owned & Operated:</h3>
                <div className="grid grid-cols-1 gap-2">
                {[
                  'Publisher',
                    'Device Manufacturer (OEM)',
                  'App Developer',
                    'MVPD (Multichannel Video Programming Distributor) or FAST Platform'
                  ].map((category) => (
                    <div key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                        checked={formData.sellerCategories.ownedAndOperated.includes(category)}
                        onChange={() => handleSellerCategoryChange('ownedAndOperated', category)}
                      />
                      <label className="ml-2 text-sm text-gray-600">{category}</label>
                    </div>
                  ))}
                </div>

                <h3 className="font-medium">Intermediary:</h3>
                <div className="grid grid-cols-1 gap-2">
                  {[
                  'Supply Side Platform (SSP)',
                    'Technology Solution (ex. Server Side Ad-Insertion, Ad Server, etc.)',
                  'Ad Network',
                  'Supplemental Content Solution or Syndication Partner',
                  'Data/Audience Enrichment Vendor'
                ].map((category) => (
                  <div key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                        checked={formData.sellerCategories.intermediary.includes(category)}
                        onChange={() => handleSellerCategoryChange('intermediary', category)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{category}</label>
                  </div>
                ))}
                </div>
              </div>
            </div>

            {/* COPPA Regulation */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                1.f. What portion of your inventory is child directed/subject to COPPA regulation?
                <RequiredIndicator />
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300 text-sm"
                value={formData.childDirectedPortion}
                onChange={(e) => handleInputChange('childDirectedPortion', e.target.value)}
                required
              >
                <option value="">Select an option</option>
                <option value="none">None, our entire offering is considered General Audience</option>
                <option value="less25">{'<25%'}</option>
                <option value="25-50">25-50%</option>
                <option value="more50">{'>50%'}</option>
              </select>
            </div>

            {/* App Stores */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                1.g. (APP Specific Question) On what AppStores can your applications be found?
                {isAppRelated(formData) && <RequiredIndicator />}
              </label>
              <div className="text-sm text-gray-500 mb-2">
                Note: Sovrn will not monetize App Bundles made accessible for download through third-party APK platforms unaffiliated with Google.
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  'Apple App Store',
                  'Google Play Store',
                  'Roku Channel Store',
                  'Samsung Apps & Services',
                  'Playstation Store',
                  'LG Content Store',
                  'Amazon Fire Store'
                ].map((store) => (
                  <div key={store} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.appStores.includes(store)}
                      onChange={(e) => handleCheckboxChange('appStores', store)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{store}</label>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700">Other (Please list other providers):</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                  value={formData.otherAppStores}
                  onChange={(e) => handleInputChange('otherAppStores', e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      case 'web':
        return (
          <div className="space-y-8">
            <h2 className="text-xl font-bold">WEB Technical Info</h2>

            {/* Integration Methods */}
          <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                3.a. Please Select All Available Integration Methods:
                {isWebRelated(formData) && <RequiredIndicator />}
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'oRTB - 2.5/2.6',
                  'TAM',
                  'UAM',
                  'Header Bidding',
                  'Prebid Server',
                  'Open Bidding',
                  'Other'
                ].map((method) => (
                  <div key={method} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.webTechnical.integrationMethods.includes(method)}
                      onChange={() => handleWebTechnicalCheckbox('integrationMethods', method)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{method}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Integration */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                3.b. Please select your preferred Integration Method
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                value={formData.webTechnical.preferredIntegration}
                onChange={(e) => handleWebTechnicalChange('preferredIntegration', e.target.value)}
              >
                <option value="">Select method</option>
                {[
                  'oRTB - 2.5/2.6',
                  'TAM',
                  'UAM',
                  'Header Bidding',
                  'Prebid Server',
                  'Open Bidding',
                  'Other'
                ].map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Video Player */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                3.c. Which Video Player are you using?
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                rows={4}
                placeholder="List out all the players currently in use with relevant details"
                value={formData.webTechnical.videoPlayer}
                onChange={(e) => handleWebTechnicalChange('videoPlayer', e.target.value)}
              />
            </div>

            {/* Pricing Strategy Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pricing Strategy</h3>
              
              {/* Pricing Strategy */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  3.d. Are you currently implementing any Pricing Strategy?
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                  value={formData.webTechnical.pricingStrategy.implementing ? 'yes' : 'no'}
                  onChange={(e) => handlePricingStrategyChange(e.target.value === 'yes')}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              {formData.webTechnical.pricingStrategy.implementing && (
                <div className="space-y-4 pl-4 border-l-2 border-yellow-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Which vendor are you currently using OR can you elaborate on your strategy?
                    </label>
                    <textarea
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                      rows={3}
                      value={formData.webTechnical.pricingStrategy.vendor}
                      onChange={(e) => handlePricingStrategyDetailChange('vendor', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      On which integration are you currently using Floors?
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                      value={formData.webTechnical.pricingStrategy.integrationUsing}
                      onChange={(e) => handlePricingStrategyDetailChange('integrationUsing', e.target.value)}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.webTechnical.pricingStrategy.sovrnOptimization}
                      onChange={(e) => handlePricingStrategyDetailChange('sovrnOptimization', e.target.checked)}
                    />
                    <label className="ml-2 text-sm text-gray-600">
                      Are you comfortable with Sovrn optimising your traffic with Floors?
                    </label>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-600">
                Please note that Sovrn's Dynamic Floors will always honour, as a hard floor, the floor passed in the bid stream
              </div>
            </div>

            {/* Total Request Volume */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                3.e. Total Request Volume - Please specify if daily or monthly:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600">Display:</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                    value={formData.webTechnical.requestVolume.display}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      webTechnical: {
                        ...prev.webTechnical,
                        requestVolume: {
                          ...prev.webTechnical.requestVolume,
                          display: e.target.value
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Video:</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                    value={formData.webTechnical.requestVolume.video}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      webTechnical: {
                        ...prev.webTechnical,
                        requestVolume: {
                          ...prev.webTechnical.requestVolume,
                          video: e.target.value
                        }
                      }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Traffic Percentage by Region */}
            <div className="space-y-6">
              <label className="block text-sm font-medium text-gray-700">
                3.f. Percentage of available traffic in the following regions:
              </label>
              
              {/* Display Traffic */}
              <div className="space-y-4">
                <h4 className="font-medium">Display</h4>
                <div className="grid grid-cols-2 gap-4">
                  {['northAmerica', 'emea', 'apac', 'latam'].map((region) => (
                    <div key={region}>
                      <label className="block text-sm text-gray-600">
                        {region === 'northAmerica' ? 'North America' :
                         region === 'emea' ? 'EMEA' :
                         region === 'apac' ? 'APAC' : 'LATAM'}:
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                        value={formData.webTechnical.trafficPercentage.display[region as Region]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          webTechnical: {
                            ...prev.webTechnical,
                            trafficPercentage: {
                              ...prev.webTechnical.trafficPercentage,
                              display: {
                                ...prev.webTechnical.trafficPercentage.display,
                                [region as Region]: e.target.value
                              }
                            }
                          }
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Video Traffic */}
              <div className="space-y-4">
                <h4 className="font-medium">Video</h4>
                <div className="grid grid-cols-2 gap-4">
                  {['northAmerica', 'emea', 'apac', 'latam'].map((region) => (
                    <div key={region}>
                      <label className="block text-sm text-gray-600">
                        {region === 'northAmerica' ? 'North America' :
                         region === 'emea' ? 'EMEA' :
                         region === 'apac' ? 'APAC' : 'LATAM'}:
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                        value={formData.webTechnical.trafficPercentage.video[region as Region]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          webTechnical: {
                            ...prev.webTechnical,
                            trafficPercentage: {
                              ...prev.webTechnical.trafficPercentage,
                              video: {
                                ...prev.webTechnical.trafficPercentage.video,
                                [region as Region]: e.target.value
                              }
                            }
                          }
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Centers */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                3.g. Please outline where your Data Centres are located:
              </label>
              <div className="grid grid-cols-3 gap-4">
                {['US', 'EU', 'APAC'].map((location) => (
                  <div key={location} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.webTechnical.dataCenters.includes(location)}
                      onChange={() => handleWebTechnicalCheckbox('dataCenters', location)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{location}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* PMP Data */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                3.h. Do you make any first/third party data available to buyers/advertisers wanting to create PMPs?
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                rows={4}
                value={formData.webTechnical.pmpData}
                onChange={(e) => handleWebTechnicalChange('pmpData', e.target.value)}
              />
            </div>

            {/* Sensitive Categories */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                3.i. Please select all sensitive categories your supply is eligible for:
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'Pharma',
                  'Gambling',
                  'LDA Advertisers',
                  'Political'
                ].map((category) => (
                  <div key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.webTechnical.sensitiveCategories.includes(category)}
                      onChange={() => handleWebTechnicalCheckbox('sensitiveCategories', category)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{category}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: oRTB Technical Questions */}
            <h2 className="text-xl font-bold mt-8">oRTB Technical Questions</h2>

            {/* Impression Tracking Methods */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                4.a. Supported Impression Tracking Method(s)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  'ADM',
                  'BURL (not currently supported)',
                  'nURL (least preferred)'
                ].map((method) => (
                  <div key={method} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.ortbTechnical.impressionTracking.includes(method)}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        ortbTechnical: {
                          ...prev.ortbTechnical,
                          impressionTracking: prev.ortbTechnical.impressionTracking.includes(method)
                            ? prev.ortbTechnical.impressionTracking.filter(m => m !== method)
                            : [...prev.ortbTechnical.impressionTracking, method]
                        }
                      }))}
                    />
                    <label className="ml-2 text-sm text-gray-600">{method}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Impression Tracking */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                4.b. (Video Specific) - do you support impression tracking by the VAST impression event or nURL/bURL?
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                rows={3}
                value={formData.ortbTechnical.videoImpressionTracking}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  ortbTechnical: {
                    ...prev.ortbTechnical,
                    videoImpressionTracking: e.target.value
                  }
                }))}
              />
            </div>

            {/* Ad-call Flow & Creative Rendering */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">Ad-call Flow & Creative Rendering</h3>
              
              <div className="space-y-4">
                {[
                  { label: 'What event causes the impression pixel to fire?', field: 'impressionEvent' as AdCallFlowField },
                  { label: 'Does the impression pixel fire client or server-side?', field: 'impressionSide' as AdCallFlowField },
                  { label: 'Does the impression pixel fire before or after creative rendering?', field: 'impressionTiming' as AdCallFlowField },
                  { label: 'Do you cache bids on your end for any purpose? elaborate on the different purposes', field: 'bidCaching' as AdCallFlowField },
                  { label: 'Do you have control over the tmax sent to Sovrn in the bid request?', field: 'tmaxControl' as AdCallFlowField }
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label className="block text-sm text-gray-700">{label}</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                      value={formData.ortbTechnical.adCallFlow[field]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ortbTechnical: {
                          ...prev.ortbTechnical,
                          adCallFlow: {
                            ...prev.ortbTechnical.adCallFlow,
                            [field]: e.target.value
                          }
                        }
                      }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Ad Quality */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">4.d. Ad Quality</h3>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                  checked={formData.ortbTechnical.adQuality.conductScanning}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ortbTechnical: {
                      ...prev.ortbTechnical,
                      adQuality: {
                        ...prev.ortbTechnical.adQuality,
                        conductScanning: e.target.checked
                      }
                    }
                  }))}
                />
                <label className="ml-2 text-sm text-gray-600">Do you conduct creative scanning?</label>
              </div>

              {formData.ortbTechnical.adQuality.conductScanning && (
                <div className="space-y-4 pl-4 border-l-2 border-yellow-200">
                  {[
                    { label: 'Which Partner is used for Creative Scanning?', field: 'scanningPartner' as AdQualityField },
                    { label: 'Rate of creative scanning (how often is this running)', field: 'scanningRate' as AdQualityField },
                    { label: 'Are there any limitations on creative payload?', field: 'payloadLimitations' as AdQualityField }
                  ].map(({ label, field }) => (
                    <div key={field}>
                      <label className="block text-sm text-gray-700">{label}</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                        value={formData.ortbTechnical.adQuality[field]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          ortbTechnical: {
                            ...prev.ortbTechnical,
                            adQuality: {
                              ...prev.ortbTechnical.adQuality,
                              [field]: e.target.value
                            }
                          }
                        }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reporting */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">4.e. Reporting</h3>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                  checked={formData.ortbTechnical.utcReporting}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ortbTechnical: {
                      ...prev.ortbTechnical,
                      utcReporting: e.target.checked
                    }
                  }))}
                />
                <label className="ml-2 text-sm text-gray-600">
                  Are you able to provide daily reports in UTC time zone by email? (impressions, Revenue)
                </label>
              </div>
            </div>

            {/* oRTB Requirements */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">4.f. oRTB Requirements</h3>
              
              <div className="space-y-4">
                {/* Text input fields */}
                {[
                  { label: 'Which version of the oRTB are you currently using?', field: 'version' },
                  { label: 'Is your platform proprietary or do you use a third party?', field: 'platform' },
                  { label: 'Do you have any public available documentation on your oRTB spec?', field: 'documentation' },
                  { label: 'Do you require any fields outside of the spec? If so, please list them.', field: 'extraFields' }
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label className="block text-sm text-gray-700">{label}</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                      value={formData.ortbTechnical.ortbRequirements[field as OrtbRequirementsTextFields]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ortbTechnical: {
                          ...prev.ortbTechnical,
                          ortbRequirements: {
                            ...prev.ortbTechnical.ortbRequirements,
                            [field]: e.target.value
                          }
                        }
                      }))}
                    />
                  </div>
                ))}

                {/* Boolean checkbox fields */}
                {[
                  { label: 'We require for you to place an account-specific ID in the site.publisher.id field of all your requests. Are you able to support this?', field: 'supportsAccountId' },
                  { label: 'Do you support gzip?', field: 'supportsGzip' },
                  { label: 'We require for you to send tag identifiers in the imp.tagid field. Are you able to support this?', field: 'supportsTagId' }
                ].map(({ label, field }) => (
                  <div key={field} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.ortbTechnical.ortbRequirements[field as OrtbRequirementsBooleanFields]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ortbTechnical: {
                          ...prev.ortbTechnical,
                          ortbRequirements: {
                            ...prev.ortbTechnical.ortbRequirements,
                            [field]: e.target.checked
                          }
                        }
                      }))}
                    />
                    <label className="ml-2 text-sm text-gray-600">{label}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Cookie Matching */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">4.g. Cookie Matching</h3>
              
              <div className="space-y-4">
                {/* Boolean fields */}
                {[
                  { label: 'Are you able to host the cookie match table on your servers?', field: 'canHostTable' },
                  { label: 'Are you able to initiate user sync with Sovrn from your traffic?', field: 'canInitiateSync' },
                  { label: 'Do you require to store any specific data points in your match table?', field: 'requiresDataPoints' },
                  { label: 'Are you able to pass GDPR or the GPP consent with user match requests?', field: 'supportsConsent' },
                  { label: 'Do you support eids and are you going to pass it in the request?', field: 'supportsEids' }
                ].map(({ label, field }) => (
                  <div key={field} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.ortbTechnical.cookieMatching[field as CookieMatchingBooleanFields]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ortbTechnical: {
                          ...prev.ortbTechnical,
                          cookieMatching: {
                            ...prev.ortbTechnical.cookieMatching,
                            [field]: e.target.checked
                          }
                        }
                      }))}
                    />
                    <label className="ml-2 text-sm text-gray-600">{label}</label>
                  </div>
                ))}

                {/* Text fields */}
                {[
                  { label: 'If you can host the cookie match table, please share the URL location:', field: 'tableUrl', show: formData.ortbTechnical.cookieMatching.canHostTable },
                  { label: 'If you require specific data points, please provide the list of MACROs to be added to your redirect URL:', field: 'macros', show: formData.ortbTechnical.cookieMatching.requiresDataPoints },
                  { label: 'What is the average match rate of your supply with other providers like Sovrn?', field: 'matchRate', show: true }
                ].map(({ label, field, show }) => show && (
                  <div key={field}>
                    <label className="block text-sm text-gray-700">{label}</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                      value={formData.ortbTechnical.cookieMatching[field as CookieMatchingTextFields]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ortbTechnical: {
                          ...prev.ortbTechnical,
                          cookieMatching: {
                            ...prev.ortbTechnical.cookieMatching,
                            [field]: e.target.value
                          }
                        }
                      }))}
                    />
                  </div>
                ))}

                {/* EIDs types - only shown when supportsEids is true */}
                {formData.ortbTechnical.cookieMatching.supportsEids && (
                  <div>
                    <label className="block text-sm text-gray-700">Which eids are you passing?</label>
                    <textarea
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                      rows={3}
                      value={formData.ortbTechnical.cookieMatching.eidsTypes.join('\n')}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ortbTechnical: {
                          ...prev.ortbTechnical,
                          cookieMatching: {
                            ...prev.ortbTechnical.cookieMatching,
                            eidsTypes: e.target.value.split('\n').filter(Boolean)
                          }
                        }
                      }))}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'ctvapp':
        return (
          <div className="space-y-8">
            <h2 className="text-xl font-bold">CTV/APP Technical Info</h2>

            {/* Integration Methods */}
          <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                5.a. Please Select All Available Integration Methods:
                {isCtvAppRelated(formData) && <RequiredIndicator />}
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'oRTB (2.5/2.6)',
                  'Publica Ad Server',
                  'SpringServe Server-side Header Bidding',
                  'Nimbus Ad Server',
                  'TAM',
                  'Prebid Server',
                  'Other'
                ].map((method) => (
                  <div key={method} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.ctvAppTechnical.integrationMethods.includes(method)}
                      onChange={() => handleCtvAppCheckbox('integrationMethods', method)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{method}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Integration */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                5.b. Please select your preferred Integration Method
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                value={formData.ctvAppTechnical.preferredIntegration}
                onChange={(e) => handleCtvAppChange('preferredIntegration', e.target.value)}
              >
                <option value="">Select method</option>
                {formData.ctvAppTechnical.integrationMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Request Volume */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                5.c. Total Request Volume (Please specify if daily or monthly):
              </label>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm text-gray-600">Total CTV Request Volume (if applicable):</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                    value={formData.ctvAppTechnical.requestVolume.ctv}
                    onChange={(e) => handleCtvAppVolumeChange('ctv', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Total In-App Request Volume (if applicable):</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                    value={formData.ctvAppTechnical.requestVolume.inApp}
                    onChange={(e) => handleCtvAppVolumeChange('inApp', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Traffic Percentage */}
            <div className="space-y-6">
              <label className="block text-sm font-medium text-gray-700">
                5.d. Percentage of available traffic in the following regions:
              </label>
              
              {/* In-APP Traffic */}
              <div className="space-y-4">
                <h4 className="font-medium">In-APP</h4>
                <div className="grid grid-cols-2 gap-4">
                  {['northAmerica', 'emea', 'apac', 'latam'].map((region) => (
                    <div key={region}>
                      <label className="block text-sm text-gray-600">
                        {region === 'northAmerica' ? 'North America' :
                         region === 'emea' ? 'EMEA' :
                         region === 'apac' ? 'APAC' : 'LATAM'}:
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                        value={formData.ctvAppTechnical.trafficPercentage.inApp[region as Region]}
                        onChange={(e) => handleCtvAppTrafficChange('inApp', region as Region, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* CTV Traffic */}
              <div className="space-y-4">
                <h4 className="font-medium">CTV</h4>
                <div className="grid grid-cols-2 gap-4">
                  {['northAmerica', 'emea', 'apac', 'latam'].map((region) => (
                    <div key={region}>
                      <label className="block text-sm text-gray-600">
                        {region === 'northAmerica' ? 'North America' :
                         region === 'emea' ? 'EMEA' :
                         region === 'apac' ? 'APAC' : 'LATAM'}:
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                        value={formData.ctvAppTechnical.trafficPercentage.ctv[region as Region]}
                        onChange={(e) => handleCtvAppTrafficChange('ctv', region as Region, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Centers */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                5.e. Please outline where your Data Centres are located:
              </label>
              <div className="grid grid-cols-3 gap-4">
                {['US', 'EU', 'APAC'].map((location) => (
                  <div key={location} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.ctvAppTechnical.dataCenters.includes(location)}
                      onChange={() => handleCtvAppCheckbox('dataCenters', location)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{location}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* PMP Data and Sensitive Categories */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  5.f. Do you make any first/third party data available to buyers/advertisers wanting to create PMPs?
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                  rows={4}
                  value={formData.ctvAppTechnical.pmpData}
                  onChange={(e) => handleCtvAppChange('pmpData', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Please select all sensitive categories your supply is eligible for:
                </label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {[
                    'Pharma',
                    'Gambling',
                    'LDA Advertisers',
                    'Political'
                  ].map((category) => (
                    <div key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                        checked={formData.ctvAppTechnical.sensitiveCategories.includes(category)}
                        onChange={() => handleCtvAppCheckbox('sensitiveCategories', category)}
                      />
                      <label className="ml-2 text-sm text-gray-600">{category}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 6: Technical Settings */}
            <h2 className="text-xl font-bold mt-8">Technical Settings</h2>

            {/* Impression Tracking Methods */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                6.a. Supported Impression Tracking Method(s)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {['ADM', 'BURL', 'nURL (least preferred)'].map((method) => (
                  <div key={method} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.ctvAppTechnical.technicalSettings.impressionTracking.includes(method)}
                      onChange={() => handleTechnicalSettingsCheckbox('impressionTracking', method)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{method}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile APP Tracking */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                6.b. (Specific to Mobile APP) - When is the BURL fired?
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                value={formData.ctvAppTechnical.technicalSettings.mobileAppTracking.burlTiming}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  ctvAppTechnical: {
                    ...prev.ctvAppTechnical,
                    technicalSettings: {
                      ...prev.ctvAppTechnical.technicalSettings,
                      mobileAppTracking: {
                        ...prev.ctvAppTechnical.technicalSettings.mobileAppTracking,
                        burlTiming: e.target.value
                      }
                    }
                  }
                }))}
              >
                <option value="">Select timing</option>
                <option value="render">When the Ad renders</option>
                <option value="viewable">When the impression is measured viewable</option>
              </select>
            </div>

            {/* Interstitial Tracking */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                6.c. (Specific to Mobile APP) - Do you track Interstitial ads any differently? If so please explain how is the tracking done)
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                rows={3}
                value={formData.ctvAppTechnical.technicalSettings.mobileAppTracking.interstitialTracking}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  ctvAppTechnical: {
                    ...prev.ctvAppTechnical,
                    technicalSettings: {
                      ...prev.ctvAppTechnical.technicalSettings,
                      mobileAppTracking: {
                        ...prev.ctvAppTechnical.technicalSettings.mobileAppTracking,
                        interstitialTracking: e.target.value
                      }
                    }
                  }
                }))}
              />
            </div>

            {/* Additional Tracking Info */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                6.d. Do you have any other relevant information in regards to Impression Tracking that you would like to disclose?
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                rows={3}
                value={formData.ctvAppTechnical.technicalSettings.mobileAppTracking.additionalInfo}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  ctvAppTechnical: {
                    ...prev.ctvAppTechnical,
                    technicalSettings: {
                      ...prev.ctvAppTechnical.technicalSettings,
                      mobileAppTracking: {
                        ...prev.ctvAppTechnical.technicalSettings.mobileAppTracking,
                        additionalInfo: e.target.value
                      }
                    }
                  }
                }))}
              />
            </div>

            {/* Networking and Servers */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">6.e. Networking and Servers</h3>
              
              <div>
                <label className="block text-sm text-gray-700">3PID support? (Please list all that you support):</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                  value={formData.ctvAppTechnical.technicalSettings.networking.threePidSupport}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ctvAppTechnical: {
                      ...prev.ctvAppTechnical,
                      technicalSettings: {
                        ...prev.ctvAppTechnical.technicalSettings,
                        networking: {
                          ...prev.ctvAppTechnical.technicalSettings.networking,
                          threePidSupport: e.target.value
                        }
                      }
                    }
                  }))}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                  checked={formData.ctvAppTechnical.technicalSettings.networking.skAdNetworkSupport}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ctvAppTechnical: {
                      ...prev.ctvAppTechnical,
                      technicalSettings: {
                        ...prev.ctvAppTechnical.technicalSettings,
                        networking: {
                          ...prev.ctvAppTechnical.technicalSettings.networking,
                          skAdNetworkSupport: e.target.checked
                        }
                      }
                    }
                  }))}
                />
                <label className="ml-2 text-sm text-gray-600">SKAdNetwork Support?</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                  checked={formData.ctvAppTechnical.technicalSettings.networking.adPodsSupport}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ctvAppTechnical: {
                      ...prev.ctvAppTechnical,
                      technicalSettings: {
                        ...prev.ctvAppTechnical.technicalSettings,
                        networking: {
                          ...prev.ctvAppTechnical.technicalSettings.networking,
                          adPodsSupport: e.target.checked
                        }
                      }
                    }
                  }))}
                />
                <label className="ml-2 text-sm text-gray-600">(CTV only) Do you support Ad Pods?</label>
              </div>
            </div>

            {/* Ad Quality */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">6.f. Ad Quality</h3>
              
              <div>
                <label className="block text-sm text-gray-700">
                  Are you currently integrated with a third-party Quality Vendor (i.e. HUMAN, MOAT, IAS, DoubleVerify, Pixalate)?
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                  value={formData.ctvAppTechnical.technicalSettings.adQuality.qualityVendors}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ctvAppTechnical: {
                      ...prev.ctvAppTechnical,
                      technicalSettings: {
                        ...prev.ctvAppTechnical.technicalSettings,
                        adQuality: {
                          ...prev.ctvAppTechnical.technicalSettings.adQuality,
                          qualityVendors: e.target.value
                        }
                      }
                    }
                  }))}
                />
              </div>
            </div>

            {/* oRTB Requirements */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">6.g. oRTB Requirements</h3>
              
              <div className="space-y-4">
                {[
                  { label: 'Do you support sending Multi-impression Object Bid Requests?', field: 'multiImpressionSupport' as const },
                  { label: 'Do you support Multi-format requests?', field: 'multiFormatSupport' as const },
                  { label: 'Do you support Multi-bid / Multi-seat responses?', field: 'multiBidSupport' as const },
                  { label: 'Do you support sending demographic, viewability, click through, etc.. data in the bid request?', field: 'demographicDataSupport' as const },
                  { label: '(CTV Only) Do you pass content object information?', field: 'contentObjectSupport' as const }
                ].map(({ label, field }) => (
                  <div key={field} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.ctvAppTechnical.technicalSettings.ortbRequirements[field]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ctvAppTechnical: {
                          ...prev.ctvAppTechnical,
                          technicalSettings: {
                            ...prev.ctvAppTechnical.technicalSettings,
                            ortbRequirements: {
                              ...prev.ctvAppTechnical.technicalSettings.ortbRequirements,
                              [field]: e.target.checked
                            }
                          }
                        }
                      }))}
                    />
                    <label className="ml-2 text-sm text-gray-600">{label}</label>
                  </div>
                ))}

                <div>
                  <label className="block text-sm text-gray-700">What are your Impression Expiry Windows (in minutes)?</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                    value={formData.ctvAppTechnical.technicalSettings.ortbRequirements.impressionExpiryWindow}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      ctvAppTechnical: {
                        ...prev.ctvAppTechnical,
                        technicalSettings: {
                          ...prev.ctvAppTechnical.technicalSettings,
                          ortbRequirements: {
                            ...prev.ctvAppTechnical.technicalSettings.ortbRequirements,
                            impressionExpiryWindow: e.target.value
                          }
                        }
                      }
                    }))}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                    checked={formData.ctvAppTechnical.technicalSettings.ortbRequirements.maxTimeout}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      ctvAppTechnical: {
                        ...prev.ctvAppTechnical,
                        technicalSettings: {
                          ...prev.ctvAppTechnical.technicalSettings,
                          ortbRequirements: {
                            ...prev.ctvAppTechnical.technicalSettings.ortbRequirements,
                            maxTimeout: e.target.checked
                          }
                        }
                      }
                    }))}
                  />
                  <label className="ml-2 text-sm text-gray-600">Do you enforce a maximum timeout threshold? (TMAX)</label>
                </div>
              </div>
            </div>

            {/* Inventory Management */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">6.h. Inventory Management</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.ctvAppTechnical.technicalSettings.inventoryManagement.requiresMapping}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ctvAppTechnical: {
                          ...prev.ctvAppTechnical,
                          technicalSettings: {
                            ...prev.ctvAppTechnical.technicalSettings,
                            inventoryManagement: {
                              ...prev.ctvAppTechnical.technicalSettings.inventoryManagement,
                              requiresMapping: e.target.checked
                            }
                          }
                        }
                      }))}
                    />
                    <label className="ml-2 text-sm text-gray-600">Do you require breaking out your inventory for mapping purposes?</label>
                  </div>

                  {formData.ctvAppTechnical.technicalSettings.inventoryManagement.requiresMapping && (
                    <div className="mt-2 ml-6">
                      <label className="block text-sm text-gray-700">
                        If you do need support with mapping, please outline the level of granularity needed. e.g. having a CTV/APP split
                      </label>
                      <textarea
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                        rows={3}
                        value={formData.ctvAppTechnical.technicalSettings.inventoryManagement.mappingGranularity}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          ctvAppTechnical: {
                            ...prev.ctvAppTechnical,
                            technicalSettings: {
                              ...prev.ctvAppTechnical.technicalSettings,
                              inventoryManagement: {
                                ...prev.ctvAppTechnical.technicalSettings.inventoryManagement,
                                mappingGranularity: e.target.value
                              }
                            }
                          }
                        }))}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-300 focus:ring-yellow-300 border-gray-300 rounded"
                      checked={formData.ctvAppTechnical.technicalSettings.inventoryManagement.hasRevenueCaps}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ctvAppTechnical: {
                          ...prev.ctvAppTechnical,
                          technicalSettings: {
                            ...prev.ctvAppTechnical.technicalSettings,
                            inventoryManagement: {
                              ...prev.ctvAppTechnical.technicalSettings.inventoryManagement,
                              hasRevenueCaps: e.target.checked
                            }
                          }
                        }
                      }))}
                    />
                    <label className="ml-2 text-sm text-gray-600">Do you have revenue caps in place?</label>
                  </div>

                  {formData.ctvAppTechnical.technicalSettings.inventoryManagement.hasRevenueCaps && (
                    <div className="mt-2 ml-6">
                      <label className="block text-sm text-gray-700">
                        Please provide details about your revenue caps:
                      </label>
                      <textarea
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-300 focus:ring-yellow-300"
                        rows={3}
                        value={formData.ctvAppTechnical.technicalSettings.inventoryManagement.revenueCapsDetails || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          ctvAppTechnical: {
                            ...prev.ctvAppTechnical,
                            technicalSettings: {
                              ...prev.ctvAppTechnical.technicalSettings,
                              inventoryManagement: {
                                ...prev.ctvAppTechnical.technicalSettings.inventoryManagement,
                                revenueCapsDetails: e.target.value
                              }
                            }
                          }
                        }))}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Update the validation functions
  const validateWebSection = (): boolean => {
    if (!isWebRelated(formData)) return true; // Skip validation if Web not selected

    return (
      formData.webTechnical.integrationMethods.length > 0 &&
      formData.webTechnical.preferredIntegration !== '' &&
      formData.webTechnical.requestVolume.display !== '' &&
      formData.webTechnical.requestVolume.video !== '' &&
      Object.values(formData.webTechnical.trafficPercentage.display).some(v => v !== '') &&
      formData.webTechnical.dataCenters.length > 0 &&
      formData.webTechnical.adServerPlatforms.length > 0 &&
      formData.webTechnical.headerBiddingType !== '' &&
      formData.webTechnical.timeoutSettings !== ''
    );
  };

  const validateCtvAppSection = (): boolean => {
    if (!isCtvAppRelated(formData)) return true; // Skip validation if CTV/APP not selected

    return (
      formData.ctvAppTechnical.integrationMethods.length > 0 &&
      formData.ctvAppTechnical.preferredIntegration !== '' &&
      formData.ctvAppTechnical.requestVolume.ctv !== '' &&
      formData.ctvAppTechnical.requestVolume.inApp !== '' &&
      Object.values(formData.ctvAppTechnical.trafficPercentage.inApp).some(v => v !== '') &&
      formData.ctvAppTechnical.dataCenters.length > 0 &&
      formData.ctvAppTechnical.adServerPlatforms.length > 0 &&
      formData.ctvAppTechnical.sdkVersions !== '' &&
      formData.ctvAppTechnical.appFramework !== ''
    );
  };

  // Update the form fields to include required indicators and validation
  // In the renderFormSection function, update these sections:

  // COPPA Regulation
  const validateGenericSection = (): boolean => {
    const baseValidation = 
      formData.name !== '' &&
      formData.email !== '' &&
      formData.businessName !== '' &&
      formData.businessDomain !== '' &&
      formData.environments.length > 0 &&
      formData.formats.length > 0 &&
      formData.operationType !== '' &&
      formData.hasSellersJson !== undefined &&
      (formData.hasSellersJson === false || (formData.hasSellersJson === true && formData.sellersJsonUrl !== '')) &&
      formData.childDirectedPortion !== '' &&
      formData.sellerCategories.ownedAndOperated.length > 0 || formData.sellerCategories.intermediary.length > 0;

    // Additional validations based on dependencies
    if (isAppRelated(formData)) {
      if (formData.appStores.length === 0) return false;
    }

    if (isIntermediarySelected(formData)) {
      if (!formData.intermediaryInfo.inventoryProportion) return false;
    }

    return baseValidation;
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Sovrn Technical RFI
          </h1>
      </div>
      </header>

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm transition-all duration-300">
        <div className="max-w-4xl mx-auto px-4">
          {/* Progress Section */}
          <div className="pb-3">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-500">Progress</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div 
                className="bg-yellow-300 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-between space-x-3 pb-4">
            <button 
              className={`flex-1 rounded-md py-2.5 px-3 text-sm font-medium transition-colors ${
                activeSection === 'generic' 
                  ? 'bg-yellow-100 text-gray-800 hover:bg-yellow-200' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveSection('generic')}
            >
              Generic Inventory Mix<RequiredIndicator />
            </button>
            <button 
              className={`flex-1 rounded-md py-2.5 px-3 text-sm font-medium transition-colors ${
                activeSection === 'web'
                  ? 'bg-yellow-100 text-gray-800 hover:bg-yellow-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveSection('web')}
            >
              WEB - Technical Info
              {isWebRelated(formData) && <RequiredIndicator />}
            </button>
            <button 
              className={`flex-1 rounded-md py-2.5 px-3 text-sm font-medium transition-colors ${
                activeSection === 'ctvapp'
                  ? 'bg-yellow-100 text-gray-800 hover:bg-yellow-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveSection('ctvapp')}
            >
              CTV/APP - Technical Info
              {isCtvAppRelated(formData) && <RequiredIndicator />}
            </button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-3xl p-8">
          <div className="max-w-3xl mx-auto">
            {renderFormSection()}
            
            {/* Submit and Save Buttons */}
            <div className="flex justify-end mt-8 space-x-3">
              <button
                type="button"
                className="px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:ring-offset-1"
                onClick={() => saveFormData('draft')}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save & Complete Later'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-md text-sm hover:bg-yellow-500 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:ring-offset-1"
                onClick={(e) => {
                  e.preventDefault();
                  saveFormData('submitted');
                }}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Form'}
              </button>
          </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App; 
