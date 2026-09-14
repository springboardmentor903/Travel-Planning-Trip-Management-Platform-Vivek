package com.tripnest.tripnest_backend.dto;

import com.tripnest.tripnest_backend.entity.Notification;
import com.tripnest.tripnest_backend.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {

    private Long id;
    private String message;
    private NotificationType type;

    @JsonProperty("isRead")
    private boolean isRead;

    private Integer tripId;
    private String tripDestination;
    private Long referenceId;
    private LocalDateTime createdAt;

    @JsonProperty("isRead")
    public boolean isRead() {
        return isRead;
    }

    @JsonProperty("isRead")
    public void setRead(boolean isRead) {
        this.isRead = isRead;
    }

    public static NotificationDTO fromEntity(Notification notification) {
        if (notification == null) {
            return null;
        }

        Integer tripId = null;
        String tripDestination = null;

        if (notification.getTrip() != null) {
            tripId = notification.getTrip().getId();
            if (notification.getTrip().getDestination() != null) {
                tripDestination = notification.getTrip().getDestination().getName();
            }
        }

        return NotificationDTO.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.isRead())
                .tripId(tripId)
                .tripDestination(tripDestination)
                .referenceId(notification.getReferenceId())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
