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
  additionalInfo?: string;
  
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
  };
}

type FormSection = 'generic' | 'webTechnical' | 'ctvAppTechnical';

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

// Add this function near your other functions but before the App component
const calculateProgress = (formData: FormData): number => {
  let totalFields = 0;
  let filledFields = 0;

  // Generic section required fields
  const genericRequired = [
    formData.environments.length > 0,
    formData.formats.length > 0,
    formData.operationType !== '',
    formData.businessName !== '',
    formData.businessDomain !== '',
  ];

  // Web Technical section required fields
  const webRequired = [
    formData.webTechnical.integrationMethods.length > 0,
    formData.webTechnical.preferredIntegration !== '',
    formData.webTechnical.requestVolume.display !== '' || formData.webTechnical.requestVolume.video !== '',
    Object.values(formData.webTechnical.trafficPercentage.display).some(v => v !== ''),
    formData.webTechnical.dataCenters.length > 0,
  ];

  // CTV/APP Technical section required fields
  const ctvRequired = [
    formData.ctvAppTechnical.integrationMethods.length > 0,
    formData.ctvAppTechnical.preferredIntegration !== '',
    formData.ctvAppTechnical.requestVolume.ctv !== '' || formData.ctvAppTechnical.requestVolume.inApp !== '',
    Object.values(formData.ctvAppTechnical.trafficPercentage.inApp).some(v => v !== ''),
    formData.ctvAppTechnical.dataCenters.length > 0,
  ];

  // Count total and filled fields
  totalFields = genericRequired.length + webRequired.length + ctvRequired.length;
  filledFields += genericRequired.filter(Boolean).length;
  filledFields += webRequired.filter(Boolean).length;
  filledFields += ctvRequired.filter(Boolean).length;

  // Calculate percentage
  return Math.round((filledFields / totalFields) * 100);
};

// Add a validation function
const validateGenericSection = (formData: FormData): boolean => {
  const mandatoryFields = [
    formData.environments.length > 0,
    formData.formats.length > 0,
    formData.operationType !== '',
    formData.businessName !== '',
    formData.businessDomain !== '',
    formData.hasSellersJson !== undefined,
    formData.sellerCategories.ownedAndOperated.length > 0 || formData.sellerCategories.intermediary.length > 0,
    formData.childDirectedPortion !== '',
  ];

  // If they have app environments, app stores are mandatory
  if (formData.environments.includes('Mobile In-App') || formData.environments.includes('CTV/OTT')) {
    mandatoryFields.push(formData.appStores.length > 0);
  }

  return mandatoryFields.every(field => field === true);
};

// Add validation for web technical section
const validateWebTechnical = (formData: FormData): boolean => {
  const requiresWebTechnical = 
    formData.environments.includes('WEB') || 
    formData.formats.includes('Display') || 
    formData.formats.includes('Video') ||
    formData.formats.includes('Native - WEB') ||
    formData.formats.includes('Interstitial - WEB');

  if (!requiresWebTechnical) return true;

  const mandatoryFields = [
    formData.webTechnical.integrationMethods.length > 0,
    formData.webTechnical.preferredIntegration !== '',
    formData.webTechnical.requestVolume.display !== '' || formData.webTechnical.requestVolume.video !== '',
    Object.values(formData.webTechnical.trafficPercentage.display).some(v => v !== '') ||
    Object.values(formData.webTechnical.trafficPercentage.video).some(v => v !== ''),
    formData.webTechnical.dataCenters.length > 0,
  ];

  return mandatoryFields.every(field => field === true);
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
    additionalInfo: '',
    
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
      sensitiveCategories: []
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
    }
  });

  // Add these state variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add this to track progress
  const [progress, setProgress] = useState<number>(0);

  // Update progress whenever form data changes
  useEffect(() => {
    const newProgress = calculateProgress(formData);
    setProgress(newProgress);
  }, [formData]);

  // Update the saveFormData function to include validations
  const saveFormData = async (status: SubmissionStatus = 'draft') => {
    setLoading(true);
    setError(null);

    try {
      // Validate generic section
      if (!validateGenericSection(formData)) {
        throw new Error('Please fill in all mandatory fields in the Inventory Mix section');
      }

      // Validate web technical section if needed
      if (!validateWebTechnical(formData)) {
        throw new Error('Please fill in all mandatory fields in the Web Technical section');
      }

      const formPayload = {
        form_data: formData,
        status: status,
        updated_at: new Date().toISOString()
      };

      const { data, error: supabaseError } = await supabase
        .from('forms')
        .insert([formPayload])
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      if (status === 'submitted') {
        alert('Form submitted successfully!');
      } else {
        alert('Progress saved! You can return to complete the form later.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      alert('Error saving form: ' + (err instanceof Error ? err.message : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (
    field: keyof Pick<FormData, 'environments' | 'formats' | 'appStores'>,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? (prev[field] as string[]).filter(item => item !== value)
        : [...(prev[field] as string[]), value]
    }));
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
            <h2 className="text-xl font-bold">Inventory Mix</h2>
            
            {/* Business Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Name
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Domain
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  value={formData.businessDomain}
                  onChange={(e) => handleInputChange('businessDomain', e.target.value)}
                />
              </div>
            </div>

            {/* Sellers.json */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Do you host a sellers.json file?
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="sellers-json-yes"
                    name="sellers-json"
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
                    checked={formData.hasSellersJson}
                    onChange={() => handleInputChange('hasSellersJson', 'true')}
                  />
                  <label htmlFor="sellers-json-yes" className="ml-2 text-sm text-gray-600">Yes</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="sellers-json-no"
                    name="sellers-json"
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
                    checked={!formData.hasSellersJson}
                    onChange={() => handleInputChange('hasSellersJson', 'false')}
                  />
                  <label htmlFor="sellers-json-no" className="ml-2 text-sm text-gray-600">No</label>
                </div>
              </div>
              
              {formData.hasSellersJson && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Please provide the URL for your JSON file:
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                    value={formData.sellersJsonUrl}
                    onChange={(e) => handleInputChange('sellersJsonUrl', e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Environments */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Please select all Environments in which you operate:
              </label>
              <div className="grid grid-cols-2 gap-4">
                {['Mobile In-App', 'Desktop In-App', 'CTV/OTT', 'WEB', 'OOH'].map((env) => (
                  <div key={env} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      checked={formData.environments.includes(env)}
                      onChange={() => handleCheckboxChange('environments', env)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{env}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Formats */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Please select all Formats you support:
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'Display',
                  'Video',
                  'Interstitial - WEB',
                  'Interstitial - APP',
                  'Native - WEB',
                  'Native - APP'
                ].map((format) => (
                  <div key={format} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      checked={formData.formats.includes(format)}
                      onChange={() => handleCheckboxChange('formats', format)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{format}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Operation Type */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Please select your Operation Type:
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                value={formData.operationType}
                onChange={(e) => handleInputChange('operationType', e.target.value)}
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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

            {/* Seller Categories */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                1.d. Which category of seller best suits your offering?
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
                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
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
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
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
                1.e. What portion of your inventory is child directed/subject to COPPA regulation?
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                value={formData.childDirectedPortion}
                onChange={(e) => handleInputChange('childDirectedPortion', e.target.value)}
              >
                <option value="none">None, our entire offering is considered General Audience</option>
                <option value="less25">{'<25%'}</option>
                <option value="25-50">25-50%</option>
                <option value="more50">{'>50%'}</option>
              </select>
            </div>

            {/* App Stores */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                1.f. (APP Specific Question) On what AppStores can your applications be found?
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
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      checked={formData.appStores.includes(store)}
                      onChange={() => handleCheckboxChange('appStores', store)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{store}</label>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700">Other (Please list other providers):</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  value={formData.otherAppStores}
                  onChange={(e) => handleInputChange('otherAppStores', e.target.value)}
                />
              </div>
            </div>

            {/* Show intermediary questions only if intermediary categories are selected */}
            {formData.sellerCategories.intermediary.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">For Entities Acting as An Intermediary:</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      checked={formData.intermediaryInfo.handlesPayments}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        intermediaryInfo: {
                          ...prev.intermediaryInfo,
                          handlesPayments: e.target.checked
                        }
                      }))}
                    />
                    <label className="ml-2 text-sm text-gray-600">Do you handle payments to publishers directly?</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      checked={formData.intermediaryInfo.supportsSupplyChain}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        intermediaryInfo: {
                          ...prev.intermediaryInfo,
                          supportsSupplyChain: e.target.checked
                        }
                      }))}
                    />
                    <label className="ml-2 text-sm text-gray-600">Do you support Supply Chain Object?</label>
                  </div>

                  {/* Add other intermediary-specific fields here */}
                </div>
              </div>
            )}
          </div>
        );
      case 'webTechnical':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Web Technical</h2>
            
            {/* Integration Methods */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Please select all Integration Methods you support:
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
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      checked={formData.webTechnical.integrationMethods.includes(method)}
                      onChange={() => handleWebTechnicalCheckbox('integrationMethods', method)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{method}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Integration */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Please select your Preferred Integration Method:
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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

            {/* Request Volume */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                What is your expected Request Volume (QPS)?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600">Display:</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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

            {/* Traffic Percentage */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                What is your Traffic Percentage per Region?
              </label>
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
                Please select all Data Centers you can connect to:
              </label>
              <div className="grid grid-cols-3 gap-4">
                {['US', 'EU', 'APAC'].map((location) => (
                  <div key={location} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      checked={formData.webTechnical.sensitiveCategories.includes(category)}
                      onChange={() => handleWebTechnicalCheckbox('sensitiveCategories', category)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{category}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'ctvAppTechnical':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">CTV/APP Technical</h2>
            
            {/* Integration Methods */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Please select all Integration Methods you support:
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
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      checked={formData.ctvAppTechnical.integrationMethods.includes(method)}
                      onChange={() => handleCtvAppCheckbox('integrationMethods', method)}
                    />
                    <label className="ml-2 text-sm text-gray-600">{method}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Integration */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Please select your Preferred Integration Method:
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
                What is your expected Request Volume (QPS)?
              </label>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm text-gray-600">Total CTV Request Volume (if applicable):</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                    value={formData.ctvAppTechnical.requestVolume.ctv}
                    onChange={(e) => handleCtvAppVolumeChange('ctv', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Total In-App Request Volume (if applicable):</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                    value={formData.ctvAppTechnical.requestVolume.inApp}
                    onChange={(e) => handleCtvAppVolumeChange('inApp', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Traffic Percentage */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                What is your Traffic Percentage per Region?
              </label>
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                        value={formData.ctvAppTechnical.trafficPercentage.inApp[region as Region]}
                        onChange={(e) => handleCtvAppTrafficChange('inApp', region as Region, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
                Please select all Data Centers you can connect to:
              </label>
              <div className="grid grid-cols-3 gap-4">
                {['US', 'EU', 'APAC'].map((location) => (
                  <div key={location} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                        checked={formData.ctvAppTechnical.sensitiveCategories.includes(category)}
                        onChange={() => handleCtvAppCheckbox('sensitiveCategories', category)}
                      />
                      <label className="ml-2 text-sm text-gray-600">{category}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Technical Settings */}
            <h2 className="text-xl font-bold mt-8">Technical Settings</h2>

            {/* Impression Tracking Methods */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Supported Impression Tracking Method(s)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {['ADM', 'BURL', 'nURL (least preferred)'].map((method) => (
                  <div key={method} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
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
                (Specific to Mobile APP) - When is the BURL fired?
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
                (Specific to Mobile APP) - Do you track Interstitial ads any differently? If so please explain how is the tracking done)
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
                Do you have any other relevant information in regards to Impression Tracking that you would like to disclose?
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
            <h3 className="text-md font-medium">Networking and Servers</h3>
            
            <div>
              <label className="block text-sm text-gray-700">3PID support? (Please list all that you support):</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
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
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
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

            {/* Ad Quality */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">Ad Quality</h3>
              
              <div>
                <label className="block text-sm text-gray-700">
                  Are you currently integrated with a third-party Quality Vendor (i.e. HUMAN, MOAT, IAS, DoubleVerify, Pixalate)?
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
              <h3 className="text-md font-medium">oRTB Requirements</h3>
              
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
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
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
              <h3 className="text-md font-medium">Inventory Management</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
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

  return (
    <div className="min-h-screen bg-white">
      {/* Non-sticky title */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        <h1 className="text-4xl font-bold text-gray-900 text-center">Sovrn Tech Form</h1>
      </div>

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
              Generic Inventory Mix
            </button>
            <button 
              className={`flex-1 rounded-md py-2.5 px-3 text-sm font-medium transition-colors ${
                activeSection === 'webTechnical'
                  ? 'bg-yellow-100 text-gray-800 hover:bg-yellow-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveSection('webTechnical')}
            >
              WEB - Technical Info
            </button>
            <button 
              className={`flex-1 rounded-md py-2.5 px-3 text-sm font-medium transition-colors ${
                activeSection === 'ctvAppTechnical'
                  ? 'bg-yellow-100 text-gray-800 hover:bg-yellow-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveSection('ctvAppTechnical')}
            >
              CTVAPP - Technical Info
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
