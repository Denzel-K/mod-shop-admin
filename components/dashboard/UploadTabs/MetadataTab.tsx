"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { KeyValueInput } from "@/components/dashboard/KeyValueInput";
import { JsonEditor } from "@/components/ui/JsonEditor";
import { Button } from "@/components/ui/button";
import { Car, Layers, Lightbulb, Circle, Square, CircleDot } from "lucide-react";

export type MetadataTabProps = {
  // Metadata mode and values (true metadata only)
  metadataMode: 'keyvalue' | 'json';
  setMetadataMode: (v: 'keyvalue' | 'json') => void;
  wrappableSurfaces: Record<string, string>;
  setWrappableSurfaces: (v: Record<string, string>) => void;
  rims: Record<string, string>;
  setRims: (v: Record<string, string>) => void;
  windows: Record<string, string>;
  setWindows: (v: Record<string, string>) => void;
  doors: Record<string, string>;
  setDoors: (v: Record<string, string>) => void;
  tyres: Record<string, string>;
  setTyres: (v: Record<string, string>) => void;
  interior: Record<string, string>;
  setInterior: (v: Record<string, string>) => void;
  lights: Record<string, string>;
  setLights: (v: Record<string, string>) => void;
  metadataJson: string;
  setMetadataJson: (v: string) => void;
  isEdit?: boolean;
};

const DEFAULT_METADATA_TEMPLATE = `{
  "wrappableSurfaces": {
    "Surface Name": "technical_surface_identifier"
  },
  "rims": {
    "Rim Name": "technical_rim_identifier"
  },
  "windows": {
    "Window Name": "technical_window_identifier"
  },
  "doors": {
    "Door Name": "technical_door_identifier"
  },
  "tyres": {
    "Tyre Name": "technical_tyre_identifier"
  },
  "interior": {
    "Interior Part": "technical_interior_identifier"
  },
  "lights": {
    "Light Name": "technical_light_identifier"
  }
}`;

const METADATA_CATEGORIES = [
  {
    id: 'wrappableSurfaces',
    label: 'Body Panels',
    icon: Car,
    description: 'Wrappable surfaces like bumpers, hood, roof, etc.',
    placeholder: { key: 'Surface name (e.g., Front Bumper)', value: 'Technical identifier' }
  },
  {
    id: 'rims',
    label: 'Wheels & Rims',
    icon: CircleDot,
    description: 'Wheel rims and related components',
    placeholder: { key: 'Rim name (e.g., Front Left Rim)', value: 'Technical identifier' }
  },
  {
    id: 'windows',
    label: 'Windows',
    icon: Square,
    description: 'Glass surfaces and windows',
    placeholder: { key: 'Window name (e.g., Windshield)', value: 'Technical identifier' }
  },
  {
    id: 'doors',
    label: 'Doors',
    icon: Layers,
    description: 'Door panels and components',
    placeholder: { key: 'Door name (e.g., Front Left Door)', value: 'Technical identifier' }
  },
  {
    id: 'tyres',
    label: 'Tyres',
    icon: Circle,
    description: 'Tire components',
    placeholder: { key: 'Tyre name (e.g., Front Left Tyre)', value: 'Technical identifier' }
  },
  {
    id: 'interior',
    label: 'Interior',
    icon: Layers,
    description: 'Interior components like seats, dashboard, etc.',
    placeholder: { key: 'Interior part (e.g., Dashboard)', value: 'Technical identifier' }
  },
  {
    id: 'lights',
    label: 'Lights',
    icon: Lightbulb,
    description: 'Lighting components',
    placeholder: { key: 'Light name (e.g., Left Headlight)', value: 'Technical identifier' }
  }
];

export function MetadataTab(props: MetadataTabProps) {
  const {
    metadataMode,
    setMetadataMode,
    wrappableSurfaces,
    setWrappableSurfaces,
    rims,
    setRims,
    windows,
    setWindows,
    doors,
    setDoors,
    tyres,
    setTyres,
    interior,
    setInterior,
    lights,
    setLights,
    metadataJson,
    setMetadataJson,
    isEdit,
  } = props;

  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Use template for new uploads when JSON editor is empty, but only show existing data when editing
  const jsonValue = metadataJson || (!isEdit ? DEFAULT_METADATA_TEMPLATE : '{}');

  return (
    <div className="space-y-5">
      {/* Metadata entry mode */}
      <div className="md:col-span-2">
        <div className="flex flex-wrap gap-2 text-xs text-slate-300 mb-2 items-center ">
          <span className="text-slate-400">Metadata input:</span>
          <div className="border-[1.5px] border-slate-700 px-2 py-[4px] rounded-md space-x-2">  
            <button type="button" onClick={() => setMetadataMode('keyvalue')} className={`px-2 py-1 rounded border transition-colors ${metadataMode==='keyvalue'? 'border-cyan-600 bg-cyan-600/20 text-cyan-300':'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70'}`}>Key-Value</button>
            <button type="button" onClick={() => setMetadataMode('json')} className={`px-2 py-1 rounded border transition-colors ${metadataMode==='json'? 'border-cyan-600 bg-cyan-600/20 text-cyan-300':'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70'}`}>JSON</button>
          </div>
        </div>
      </div>

      {/* Category selection and inputs */}
      {metadataMode === 'keyvalue' && (
        <div className="md:col-span-2 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          {!selectedCategory ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-slate-200 mb-2">Select a Category</h3>
                <p className="text-sm text-slate-400 mb-6">Choose which type of surfaces you want to configure</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {METADATA_CATEGORIES.map((category) => {
                  const IconComponent = category.icon;
                  const categoryData = {
                    wrappableSurfaces,
                    rims,
                    windows,
                    doors,
                    tyres,
                    interior,
                    lights
                  }[category.id as keyof typeof categoryData] as Record<string, string>;
                  
                  const itemCount = Object.keys(categoryData || {}).length;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className="p-4 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700 rounded-lg transition-colors text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className="w-5 h-5 text-cyan-400 mt-0.5 group-hover:text-cyan-300" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-slate-200 group-hover:text-white">{category.label}</h4>
                            {itemCount > 0 && (
                              <span className="text-xs bg-cyan-600/20 text-cyan-300 px-2 py-1 rounded-full">
                                {itemCount} item{itemCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{category.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category header with back button */}
              
              
              {/* Selected category input */}
              {(() => {
                const category = METADATA_CATEGORIES.find(c => c.id === selectedCategory);
                if (!category) return null;
                
                const IconComponent = category.icon;
                const categoryData = {
                  wrappableSurfaces,
                  rims,
                  windows,
                  doors,
                  tyres,
                  interior,
                  lights
                }[category.id as keyof typeof categoryData] as Record<string, string>;
                
                const setCategoryData = {
                  wrappableSurfaces: setWrappableSurfaces,
                  rims: setRims,
                  windows: setWindows,
                  doors: setDoors,
                  tyres: setTyres,
                  interior: setInterior,
                  lights: setLights
                }[category.id as keyof typeof setCategoryData] as (value: Record<string, string>) => void;
                
                return (
                  <div className="space-y-3">
                    <div className="flex flex-row items-center w-full justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-5 h-5 text-cyan-400" />
                        <Label className="text-slate-300 text-lg font-medium">{category.label}</Label>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCategory('')}
                        className="text-slate-400 hover:text-slate-200 hover:bg-blue-400 border-[1.6px] border-gray-700"
                      >
                        ← Back to Categories
                      </Button>  
                    </div>

                    <p className="text-sm text-slate-400 mb-4">{category.description}</p>
                    <KeyValueInput 
                      value={categoryData || {}} 
                      onChange={setCategoryData} 
                      placeholder={category.placeholder}
                    />
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Raw JSON metadata editor */}
      {metadataMode === 'json' && (
        <div className="md:col-span-2 space-y-2 animate-in fade-in zoom-in-95 duration-200">
          <Label className="text-slate-300">Raw Metadata JSON</Label>
          <JsonEditor
            value={jsonValue}
            onChange={setMetadataJson}
            placeholder='{"wrappableSurfaces":["Body","Hood"],"windows":["Front_Windshield"]}'
            height="600px"
          />
          <p className="text-xs text-slate-500">
            Edit JSON metadata with syntax highlighting and error detection. 
            This will override the key-value inputs above when saved.
          </p>
        </div>
      )}
    </div>
  );
}
