"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { HelpCircle, Plus, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { integrationsAtom, integrationsVersionAtom } from "../../../../lib/integrations-store";
import { managedConnectionProviderAtom, managedConnectionStatusAtom } from "../../../../lib/managed-connection";
import type { IntegrationType } from "../../../../lib/types/integration";
import { ConditionFields } from "../../../../plugins/condition/components/condition-fields";
import { DatabaseQueryFields } from "../../../../plugins/database/components/database-query-fields";
import { LoopFields } from "../../../../plugins/loop/components/loop-fields";
import {
  findActionById,
  getActionsByCategory,
  getAllIntegrations,
  integrationRequiresCredentials,
} from "../../../../plugins/registry.js";
import { ConfigureConnectionOverlay } from "../../overlays/add-connection-overlay";
import { useOverlay } from "../../overlays/overlay-provider";
import { Button } from "../../ui/button";
import { CodeEditor } from "../../ui/code-editor";
import { IntegrationIcon } from "../../ui/integration-icon";
import { IntegrationSelector } from "../../ui/integration-selector";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "../../ui/select";
import { TemplateBadgeInput } from "../../ui/template-badge-input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";
import { ActionConfigRenderer } from "./action-config-renderer";
import { SYSTEM_ACTIONS } from "./system-action";

type ActionConfigProps = {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
  isOwner?: boolean;
};

// HTTP Request fields component
function HttpRequestFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="httpMethod">HTTP Method</Label>
        <Select
          disabled={ disabled }
          onValueChange={ (value) => onUpdateConfig("httpMethod", value) }
          value={ (config?.httpMethod as string) || "POST" }
        >
          <SelectTrigger className="w-full" id="httpMethod">
            <SelectValue placeholder="Select method"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="endpoint">URL</Label>
        <TemplateBadgeInput
          disabled={ disabled }
          id="endpoint"
          onChange={ (value) => onUpdateConfig("endpoint", value) }
          placeholder="https://api.example.com/endpoint or {{NodeName.url}}"
          value={ (config?.endpoint as string) || "" }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="httpHeaders">Headers (JSON)</Label>
        <div className="overflow-hidden rounded-md border">
          <CodeEditor
            defaultLanguage="json"
            height="100px"
            onChange={ (value) => onUpdateConfig("httpHeaders", value || "{}") }
            options={ {
              minimap: { enabled: false },
              lineNumbers: "off",
              scrollBeyondLastLine: false,
              fontSize: 12,
              readOnly: disabled,
              wordWrap: "off",
            } }
            value={ (config?.httpHeaders as string) || "{}" }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="httpBody">Body (JSON)</Label>
        <div
          className={ `overflow-hidden rounded-md border ${ config?.httpMethod === "GET" ? "opacity-50" : "" }` }
        >
          <CodeEditor
            defaultLanguage="json"
            height="120px"
            onChange={ (value) => onUpdateConfig("httpBody", value || "{}") }
            options={ {
              minimap: { enabled: false },
              lineNumbers: "off",
              scrollBeyondLastLine: false,
              fontSize: 12,
              readOnly: config?.httpMethod === "GET" || disabled,
              domReadOnly: config?.httpMethod === "GET" || disabled,
              wordWrap: "off",
            } }
            value={ (config?.httpBody as string) || "{}" }
          />
        </div>
        { config?.httpMethod === "GET" && (
          <p className="text-muted-foreground text-xs">
            Body is disabled for GET requests
          </p>
        ) }
      </div>
    </>
  );
}

// System action fields wrapper - extracts conditional rendering to reduce complexity
function SystemActionFields({
  actionType,
  config,
  onUpdateConfig,
  disabled,
}: {
  actionType: string;
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: string) => void;
  disabled: boolean;
}) {
  switch (actionType) {
    case "HTTP Request":
      return (
        <HttpRequestFields
          config={ config }
          disabled={ disabled }
          onUpdateConfig={ onUpdateConfig }
        />
      );
    case "Database Query":
      return (
        <DatabaseQueryFields
          config={ config }
          disabled={ disabled }
          onUpdateConfig={ onUpdateConfig }
        />
      );
    case "Condition":
      return (
        <ConditionFields
          config={ config }
          disabled={ disabled }
          onUpdateConfig={ onUpdateConfig }
        />
      );
    case "Loop":
      return (
        <LoopFields
          config={ config }
          disabled={ disabled }
          onUpdateConfig={ onUpdateConfig }
        />
      );
    default:
      return null;
  }
}

const SYSTEM_ACTION_IDS = SYSTEM_ACTIONS.map((a) => a.id);

// System actions that need integrations (not in plugin registry)
const SYSTEM_ACTION_INTEGRATIONS: Record<string, IntegrationType> = {
  "Database Query": "database",
};

// Build category mapping dynamically from plugins + System
function useCategoryData() {
  return useMemo(() => {
    const pluginCategories = getActionsByCategory();

    // Build category map including System with both id and label
    const allCategories: Record<
      string,
      Array<{ id: string; label: string }>
    > = {
      System: SYSTEM_ACTIONS,
    };

    for (const [category, actions] of Object.entries(pluginCategories)) {
      allCategories[category] = actions.map((a) => ({
        id: a.id,
        label: a.label,
      }));
    }

    return allCategories;
  }, []);
}

// Get category for an action type (supports both new IDs, labels, and legacy labels)
function getCategoryForAction(actionType: string): string | null {
  // Check system actions first
  if (SYSTEM_ACTION_IDS.includes(actionType)) {
    return "System";
  }

  // Use findActionById which handles legacy labels from plugin registry
  const action = findActionById(actionType);
  if (action?.category) {
    return action.category;
  }

  return null;
}

// Normalize action type to new ID format (handles legacy labels via findActionById)
function normalizeActionType(actionType: string): string {
  // Check system actions first - they use their label as ID
  if (SYSTEM_ACTION_IDS.includes(actionType)) {
    return actionType;
  }

  // Use findActionById which handles legacy labels and returns the proper ID
  const action = findActionById(actionType);
  if (action) {
    return action.id;
  }

  return actionType;
}

export function ActionConfig({
  config,
  onUpdateConfig,
  disabled,
  isOwner = true,
}: ActionConfigProps) {
  const actionType = (config?.actionType as string) || "";
  const categories = useCategoryData();
  const integrations = useMemo(() => getAllIntegrations(), []);

  const selectedCategory = actionType ? getCategoryForAction(actionType) : null;
  const [category, setCategory] = useState<string>(selectedCategory || "");
  const setIntegrationsVersion = useSetAtom(integrationsVersionAtom);
  const globalIntegrations = useAtomValue(integrationsAtom);
  const { push } = useOverlay();

  // Managed connection state (populated by plugin)
  const managedProvider = useAtomValue(managedConnectionProviderAtom);
  const managedStatus = useAtomValue(managedConnectionStatusAtom);

  // Sync category state when actionType changes (e.g., when switching nodes)
  useEffect(() => {
    const newCategory = actionType ? getCategoryForAction(actionType) : null;
    setCategory(newCategory || "");
  }, [actionType]);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    // Auto-select the first action in the new category
    const firstAction = categories[newCategory]?.[0];
    if (firstAction) {
      onUpdateConfig("actionType", firstAction.id);
    }
  };

  const handleActionTypeChange = (value: string) => {
    onUpdateConfig("actionType", value);
  };

  // Adapter for plugin config components that expect (key, value: unknown)
  const handlePluginUpdateConfig = (key: string, value: unknown) => {
    onUpdateConfig(key, String(value));
  };

  // Get dynamic config fields for plugin actions
  const pluginAction = actionType ? findActionById(actionType) : null;

  // Determine the integration type for the current action
  const integrationType: IntegrationType | undefined = useMemo(() => {
    if (!actionType) {
      return;
    }

    // Check system actions first
    if (SYSTEM_ACTION_INTEGRATIONS[actionType]) {
      return SYSTEM_ACTION_INTEGRATIONS[actionType];
    }

    // Check plugin actions — only require connection if plugin has credential fields
    const action = findActionById(actionType);
    const type = action?.integration as IntegrationType | undefined;
    if (type && !integrationRequiresCredentials(type)) return undefined;
    return type;
  }, [actionType]);

  // Check if managed keys should be offered (user can have multiple for different teams)
  const shouldUseManagedKeys =
    managedProvider?.integrationType === integrationType &&
    managedStatus?.enabled &&
    managedStatus?.isVercelUser;

  // Check if there are existing connections for this integration type
  const hasExistingConnections = useMemo(() => {
    if (!integrationType) return false;
    return globalIntegrations.some((i) => i.type === integrationType);
  }, [integrationType, globalIntegrations]);

  const handleConsentSuccess = (integrationId: string) => {
    onUpdateConfig("integrationId", integrationId);
    setIntegrationsVersion((v) => v + 1);
  };

  const openConnectionOverlay = () => {
    if (integrationType) {
      push(ConfigureConnectionOverlay, {
        type: integrationType,
        onSuccess: (integrationId: string) => {
          setIntegrationsVersion((v) => v + 1);
          onUpdateConfig("integrationId", integrationId);
        },
      });
    }
  };

  const handleAddSecondaryConnection = () => {
    if (shouldUseManagedKeys && managedProvider) {
      push(managedProvider.ConsentOverlay, {
        onConsent: handleConsentSuccess,
        onManualEntry: openConnectionOverlay,
      });
    } else {
      openConnectionOverlay();
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="ml-1" htmlFor="actionCategory">
            Service
          </Label>
          <Select
            disabled={ disabled }
            onValueChange={ handleCategoryChange }
            value={ category || undefined }
          >
            <SelectTrigger className="w-full" id="actionCategory">
              <SelectValue placeholder="Select category"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="System">
                <div className="flex items-center gap-2">
                  <Settings className="size-4"/>
                  <span>System</span>
                </div>
              </SelectItem>
              <SelectSeparator/>
              { integrations.map((integration) => (
                <SelectItem key={ integration.type } value={ integration.label }>
                  <div className="flex items-center gap-2">
                    <IntegrationIcon
                      className="size-4"
                      integration={ integration.type }
                    />
                    <span>{ integration.label }</span>
                  </div>
                </SelectItem>
              )) }
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="ml-1" htmlFor="actionType">
            Action
          </Label>
          <Select
            disabled={ disabled || !category }
            onValueChange={ handleActionTypeChange }
            value={ normalizeActionType(actionType) || undefined }
          >
            <SelectTrigger className="w-full" id="actionType">
              <SelectValue placeholder="Select action"/>
            </SelectTrigger>
            <SelectContent>
              { category &&
                categories[category]?.map((action) => (
                  <SelectItem key={ action.id } value={ action.id }>
                    { action.label }
                  </SelectItem>
                )) }
            </SelectContent>
          </Select>
        </div>
      </div>

      { integrationType && isOwner && (
        <div className="space-y-2">
          <div className="ml-1 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Label>Connection</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="size-3.5 text-muted-foreground"/>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>API key or OAuth credentials for this service</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            { hasExistingConnections && (
              <Button
                className="size-6"
                disabled={ disabled }
                onClick={ handleAddSecondaryConnection }
                size="icon"
                variant="ghost"
              >
                <Plus className="size-4"/>
              </Button>
            ) }
          </div>
          <IntegrationSelector
            disabled={ disabled }
            integrationType={ integrationType }
            onChange={ (id) => onUpdateConfig("integrationId", id) }
            value={ (config?.integrationId as string) || "" }
          />
        </div>
      ) }

      {/* System actions - hardcoded config fields */ }
      <SystemActionFields
        actionType={ (config?.actionType as string) || "" }
        config={ config }
        disabled={ disabled }
        onUpdateConfig={ onUpdateConfig }
      />

      {/* Plugin actions - declarative config fields */ }
      { pluginAction && !SYSTEM_ACTION_IDS.includes(actionType) && (
        <ActionConfigRenderer
          config={ config }
          disabled={ disabled }
          fields={ pluginAction.configFields }
          onUpdateConfig={ handlePluginUpdateConfig }
        />
      ) }
    </>
  );
}
