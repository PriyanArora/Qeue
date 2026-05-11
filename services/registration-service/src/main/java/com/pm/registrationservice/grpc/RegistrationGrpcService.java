package com.pm.registrationservice.grpc;

import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import registration.RegistrationResponse;
import registration.RegistrationServiceGrpc.RegistrationServiceImplBase;

@GrpcService
public class RegistrationGrpcService extends RegistrationServiceImplBase {
    private static final Logger log = LoggerFactory.getLogger(RegistrationGrpcService.class);

    @Override
    public void createRegistration(registration.RegistrationRequest registrationRequest,
                                   StreamObserver<registration.RegistrationResponse> responseObserver) {
        log.info("createRegistration request received {}" , registrationRequest.toString());

        RegistrationResponse response = RegistrationResponse.newBuilder()
                .setRegistrationId("12345")
                .setStatus("CONFIRMED")
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}
