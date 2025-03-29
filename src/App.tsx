import React, { useState, useEffect } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';
import { supabase } from './lib/supabaseClient';
import { LoadingSpinner } from './components/LoadingSpinner';
import { FormList } from './components/FormList';
import debounce from 'lodash/debounce';

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

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<FormSection>('generic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // First, create an initial form state constant
  const initialFormState: FormData = {
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
        }
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
  };

  // Use initialFormState in useState
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [formId, setFormId] = useState<string | null>(null);
  const [showFormList, setShowFormList] = useState(false);
  const [version, setVersion] = useState(1);

  // Add state for tracking if there are any saved forms
  const [hasSavedForms, setHasSavedForms] = useState(false);

  // Update startNewForm function
  const startNewForm = () => {
    if (window.confirm('Start a new form? Any unsaved changes will be lost.')) {
      setFormData(initialFormState);
      setFormId(null);
      localStorage.removeItem('formId');
      setActiveSection('generic');
      setVersion(1);
      // Clear URL parameters
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  // Update the saveFormData function with better error handling
  const saveFormData = async (status: SubmissionStatus = 'draft') => {
    setLoading(true);
    try {
      const formPayload = {
        form_data: formData,
        active_section: activeSection,
        status: status,
        updated_at: new Date().toISOString()
      };

      if (formId) {
        const { error } = await supabase
          .from('forms')
          .update(formPayload)
          .eq('id', formId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('forms')
          .insert([{ 
            ...formPayload, 
            created_at: new Date().toISOString() 
          }])
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          setFormId(data.id);
          localStorage.setItem('formId', data.id);
          
          // Show save link
          const saveLink = `${window.location.origin}${window.location.pathname}?form=${data.id}`;
          alert(`Form saved! You can return to this form using this link:\n${saveLink}`);
        }
      }

      if (status === 'submitted') {
        alert('Form submitted successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      alert(`Error saving form: ${err instanceof Error ? err.message : err}`);
    } finally {
      setLoading(false);
    }
  };

  // Update useEffect to check for saved forms
  useEffect(() => {
    const loadSavedForm = async () => {
      // Check URL parameters first
      const params = new URLSearchParams(window.location.search);
      const urlFormId = params.get('form');
      const savedFormId = urlFormId || localStorage.getItem('formId');

      try {
        // First check if there are any forms
        const { data: forms, error: formsError } = await supabase
          .from('forms')
          .select('id');

        if (!formsError && forms) {
          setHasSavedForms(forms.length > 0);
        }

        // Then load specific form if ID exists
        if (savedFormId) {
          setLoading(true);
          const { data, error } = await supabase
            .from('forms')
            .select('*')
            .eq('id', savedFormId)
            .single();

          if (error) throw error;

          if (data) {
            setFormId(data.id);
            setFormData(data.form_data);
            setActiveSection(data.active_section);
            localStorage.setItem('formId', data.id);
          }
        }
      } catch (err) {
        console.error('Error loading saved form:', err);
        setError('Failed to load saved form. Starting new form.');
        localStorage.removeItem('formId');
      } finally {
        setLoading(false);
      }
    };

    loadSavedForm();
  }, []);

  // Add auto-save function
  const autoSave = debounce(async () => {
    if (formId) {
      await saveFormData('draft');
    }
  }, 2000);

  // Add form deletion function
  const deleteForm = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('forms')
          .delete()
          .eq('id', id);

        if (error) throw error;

        if (id === formId) {
          startNewForm();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
  };

  // Update form data handlers to trigger auto-save
  const handleFormDataChange = (newData: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
    setVersion(v => v + 1);
    autoSave();
  };

  return (
    <div className="min-h-screen bg-white">
      {loading && <LoadingSpinner />}
      
      {/* Header with buttons */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-900">Sovrn Tech Form</h1>
          <div className="space-x-4">
            {hasSavedForms && (
              <button
                onClick={() => setShowFormList(prev => !prev)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
              >
                {showFormList ? 'Hide Forms' : 'Show Saved Forms'}
              </button>
            )}
            <button
              onClick={startNewForm}
              className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-md hover:bg-yellow-500"
            >
              Start New Form
            </button>
          </div>
        </div>
        
        {/* Form info */}
        {formId && (
          <div className="mt-2 text-sm text-gray-600">
            Form ID: {formId} (Version: {version})
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}

        {/* Show form list only if there are saved forms and button is clicked */}
        {hasSavedForms && showFormList && (
          <div className="mt-6">
            <FormList 
              onSelectForm={(id) => {
                if (window.confirm('Load this form? Any unsaved changes will be lost.')) {
                  window.location.search = `?form=${id}`;
                }
              }}
              onDeleteForm={deleteForm}
            />
          </div>
        )}
      </div>

      {/* Show the form when there are no saved forms or form list is hidden */}
      {(!hasSavedForms || !showFormList) && (
        <div className="max-w-4xl mx-auto px-4">
          {/* Your form content goes here */}
        </div>
      )}
    </div>
  );
};

export default App; 
