const env = import.meta.env || {}

const topic = (key) => {
  const value = env[key]
  return typeof value === 'string' ? value.trim() : ''
}

export const ROS_TOPICS = {
  laserScan: topic('VITE_ROS_LASER_SCAN_TOPIC'),
  pointCloud: topic('VITE_ROS_POINTCLOUD_TOPIC'),
  inflatedMap: topic('VITE_ROS_INFLATED_MAP_TOPIC'),
  odom: topic('VITE_ROS_ODOM_TOPIC'),
  pose: topic('VITE_ROS_POSE_TOPIC'),
  expectedControl: topic('VITE_ROS_EXPECTED_CONTROL_TOPIC'),
  initialPose: topic('VITE_ROS_INITIAL_POSE_TOPIC'),
  goalMarker: topic('VITE_ROS_GOAL_MARKER_TOPIC'),
  expSfc: topic('VITE_ROS_EXP_SFC_TOPIC'),
  path: topic('VITE_ROS_PATH_TOPIC'),
  expTraj: topic('VITE_ROS_EXP_TRAJ_TOPIC'),
  backupTraj: topic('VITE_ROS_BACKUP_TRAJ_TOPIC'),
  cmdVel: topic('VITE_ROS_CMD_VEL_TOPIC')
}

export const getDefaultVisualizationTopics = () => [
  { topic: ROS_TOPICS.pointCloud, type: 'sensor_msgs/msg/PointCloud2' },
  { topic: ROS_TOPICS.odom, type: 'nav_msgs/msg/Odometry' },
  { topic: ROS_TOPICS.goalMarker, type: 'visualization_msgs/msg/MarkerArray' },
  { topic: ROS_TOPICS.expSfc, type: 'visualization_msgs/msg/MarkerArray' },
  { topic: ROS_TOPICS.path, type: 'nav_msgs/msg/Path' },
  { topic: ROS_TOPICS.expTraj, type: 'visualization_msgs/msg/MarkerArray' },
  { topic: ROS_TOPICS.backupTraj, type: 'visualization_msgs/msg/MarkerArray' },
  { topic: ROS_TOPICS.inflatedMap, type: 'sensor_msgs/msg/PointCloud2' }
].filter(item => item.topic)

export const getPositionTopics = () => [
  { topic: ROS_TOPICS.odom, type: 'nav_msgs/msg/Odometry' }
].filter(item => item.topic)
