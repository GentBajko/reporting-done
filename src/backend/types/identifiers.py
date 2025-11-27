from typing import NewType

UserId = NewType("UserId", str)
ProjectId = NewType("ProjectId", str)
TaskId = NewType("TaskId", str)
LogId = NewType("LogId", str)
AvailabilityId = NewType("AvailabilityId", str)
ProjectUserId = NewType("ProjectUserId", str)

EntityId = UserId | ProjectId | TaskId | LogId | AvailabilityId

