# Base Workflow Component

This component introduces the core workflow functionality. This includes:

- Workflow steps, workflow templates and workflows

The following sections list the component contribution.

## npm packages

- @aws-ee/workflow-engine
- @aws-ee/base-workflow-core
- @aws-ee/base-workflow-steps
- @aws-ee/base-workflow-templates

## Database tables

- DbStepTemplates
- DbWorkflowTemplates
- DbWorkflowTemplateDrafts
- DbWorkflowDrafts
- DbWorkflows
- DbWorkflowInstances
- DbWorkflowEventTriggers

## Settings

- New

  - workflowsEnabled
  - workflowStateMachineName
  - workflowStateMachineArn
  - (static) these settings are computed in code:
    - dbStepTemplates
    - dbWorkflowTemplates
    - dbWorkflows
    - dbWorkflowTemplateDrafts
    - dbWorkflowDrafts
    - dbWorkflowInstances
    - dbWorkflowEventTriggers

- Used
  - dbPrefix

## Runtime extension points

- New

  - 'workflow-steps': { registerWorkflowSteps(stepRegistry) }
  - 'workflow-templates': { registerWorkflowTemplates(templateRegistry) }
  - 'workflows': { registerWorkflows(workflowRegistry) }
  - 'workflow-event-triggers': { registerWorkflowEventTrigger(eventTriggerRegistry) }

- Availability

  - backend deployable unit
    - backend/src/lambdas/workflow-loop-runner
  - post-deployment deployable unit
    - post-deployment/src/lambdas/post-deployment

- Used
  - 'service'
  - 'postDeploymentStep'

## New services

- stepRegistryService
- stepTemplateService
- workflowEventTriggersRegistryService
- workflowEventTriggersService
- workflowDraftService
- workflowInstanceService
- workflowRegistryService
- workflowService
- workflowTemplateDraftService
- workflowTemplateRegistryService
- workflowTemplateService
- workflowTriggerService

## New post deployment steps

- AddStepTemplates
- AddWorkflowEventTrigger
- AddWorkflowTemplates
- AddWorkflows

## CloudFormation resources

- Workflow Loop Runner Lambda
- Step Functions
- Database tables
- A few IAM roles

## Dependencies

- Base Component
- Base REST API Component
- Base UI Component
- Base Post Deployment Component
- EventBridge Component
