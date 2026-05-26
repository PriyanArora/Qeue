# Local Kubernetes

Build and load images into kind:

```sh
docker build -t qeue/identity-service:local services/identity-service
docker build -t qeue/event-service:local services/event-service
docker build -t qeue/registration-service:local services/registration-service
docker build -t qeue/notification-worker:local services/notification-worker
docker build -t qeue/gateway-service:local services/gateway-service
docker build -t qeue/web-client:local web-client
kind load docker-image qeue/identity-service:local qeue/event-service:local qeue/registration-service:local qeue/notification-worker:local qeue/gateway-service:local qeue/web-client:local
kubectl apply -k deploy/k8s/overlays/local
kubectl -n qeue-local get pods
kubectl -n qeue-local port-forward svc/web-client 3000:80
```

Open `http://localhost:3000`.
