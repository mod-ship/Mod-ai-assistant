"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Zap, Eye, Code, Brain, Star, DollarSign, CheckCircle, Sparkles } from "lucide-react"
import {
  AI_MODELS,
  getModelsByCategory,
  getFastestModels,
  getCheapestModels,
  getVisionModels,
  type AIModel,
} from "@/lib/ai-models"

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
  onClose: () => void
}

export function ModelSelector({ selectedModel, onModelChange, onClose }: ModelSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const filteredModels = React.useMemo(() => {
    let models = AI_MODELS

    // Filter by category
    if (selectedCategory !== "all") {
      switch (selectedCategory) {
        case "fastest":
          models = getFastestModels()
          break
        case "cheapest":
          models = getCheapestModels()
          break
        case "vision":
          models = getVisionModels()
          break
        default:
          models = getModelsByCategory(selectedCategory)
      }
    }

    // Filter by search query
    if (searchQuery) {
      models = models.filter(
        (model) =>
          model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          model.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
          model.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    return models
  }, [searchQuery, selectedCategory])

  const featuredModels = [
    "deepseek/deepseek-r1-0528:free",
    "anthropic/claude-sonnet-4",
    "openai/gpt-4o",
    "llama-3.3-70b-versatile",
  ]

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "chat":
        return <Sparkles className="h-4 w-4" />
      case "vision":
        return <Eye className="h-4 w-4" />
      case "code":
        return <Code className="h-4 w-4" />
      case "reasoning":
        return <Brain className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  const getPricingTier = (model: AIModel) => {
    const totalCost = model.pricing.input + model.pricing.output
    if (totalCost === 0) return { tier: "Free", color: "bg-green-500" }
    if (totalCost < 0.002) return { tier: "Budget", color: "bg-blue-500" }
    if (totalCost < 0.01) return { tier: "Standard", color: "bg-yellow-500" }
    return { tier: "Premium", color: "bg-purple-500" }
  }

  const ModelCard = ({ model }: { model: AIModel }) => {
    const isSelected = model.id === selectedModel
    const pricingTier = getPricingTier(model)
    const isFeatured = featuredModels.includes(model.id)

    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary shadow-md" : ""}`}
        onClick={() => {
          onModelChange(model.id)
          onClose()
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">{model.name}</CardTitle>
                {isFeatured && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {isSelected && (
                  <Badge className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm">{model.provider}</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="text-xs">
                {getCategoryIcon(model.category)}
                <span className="ml-1 capitalize">{model.category}</span>
              </Badge>
              <Badge className={`text-xs text-white ${pricingTier.color}`}>{pricingTier.tier}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{model.description}</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Context Window:</span>
              <span className="font-medium">{model.contextWindow.toLocaleString()} tokens</span>
            </div>

            {model.pricing.input > 0 || model.pricing.output > 0 ? (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Pricing:</span>
                <span className="font-medium">
                  ${model.pricing.input.toFixed(4)}/1K in • ${model.pricing.output.toFixed(4)}/1K out
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Pricing:</span>
                <Badge variant="secondary" className="text-xs">
                  Free
                </Badge>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-3">
            {model.capabilities.slice(0, 3).map((capability) => (
              <Badge key={capability} variant="outline" className="text-xs">
                {capability}
              </Badge>
            ))}
            {model.capabilities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{model.capabilities.length - 3} more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          MOD AI Assistant Models
        </h2>
        <p className="text-muted-foreground mt-2">Choose from 15+ advanced AI models for different tasks</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search models by name, provider, or capability..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="chat">
            <Sparkles className="h-4 w-4 mr-1" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="vision">
            <Eye className="h-4 w-4 mr-1" />
            Vision
          </TabsTrigger>
          <TabsTrigger value="reasoning">
            <Brain className="h-4 w-4 mr-1" />
            Reasoning
          </TabsTrigger>
          <TabsTrigger value="fastest">
            <Zap className="h-4 w-4 mr-1" />
            Fastest
          </TabsTrigger>
          <TabsTrigger value="cheapest">
            <DollarSign className="h-4 w-4 mr-1" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code className="h-4 w-4 mr-1" />
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {/* Featured Models Section */}
          {selectedCategory === "all" && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Featured Models
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AI_MODELS.filter((model) => featuredModels.includes(model.id)).map((model) => (
                  <ModelCard key={model.id} model={model} />
                ))}
              </div>
            </div>
          )}

          {/* All Models */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {selectedCategory === "all"
                  ? "All Models"
                  : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Models`}
              </h3>
              <Badge variant="outline">
                {filteredModels.length} model{filteredModels.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                {filteredModels.map((model) => (
                  <ModelCard key={model.id} model={model} />
                ))}
              </div>
            </ScrollArea>
          </div>

          {filteredModels.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No models found</h3>
              <p className="text-muted-foreground">Try adjusting your search or category filters</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{getCheapestModels().length}</div>
          <div className="text-sm text-muted-foreground">Free Models</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{getVisionModels().length}</div>
          <div className="text-sm text-muted-foreground">Vision Models</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{getFastestModels().length}</div>
          <div className="text-sm text-muted-foreground">Fast Models</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{AI_MODELS.length}</div>
          <div className="text-sm text-muted-foreground">Total Models</div>
        </div>
      </div>
    </div>
  )
}
