terraform {
    required_providers {
        azurerm = {
            source = "hashicorp/azurerm"
            version = "~> 3.0"
        }
    }
}

provider "azurerm" {
    features {}
}

resource "azurerm_resource_group" "rg" {
    name = "rg-boulderai-dev"
    location = "Sweden Central"
}

resource "azurerm_container_registry" "acr" {
    name = "acrboulderaifl"
    resource_group_name = azurerm_resource_group.rg.name
    location = azurerm_resource_group.rg.location
    sku = "Basic"
    admin_enabled = true
}

resource "azurerm_kubernetes_cluster" "aks" {
    name = "aks-boulderai-dev"
    location = azurerm_resource_group.rg.location
    resource_group_name = azurerm_resource_group.rg.name
    dns_prefix = "aksboulderai"

    default_node_pool {
        name = "default"
        node_count = 1
        vm_size = "Standard_B2s_v2"
    }

    identity {
        type = "SystemAssigned"
    }
}

resource "azurerm_role_assignment" "aks_acr_pull" {
    scope = azurerm_container_registry.acr.id
    role_definition_name = "AcrPull"
    principal_id = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
}