const env = import.meta.env || {}

const topic = (key, fallback) => {
  const value = env[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export const ROS_TOPICS = {
  laserScan: topic('VITE_ROS_LASER_SCAN_TOPIC', '/scan'),
  pointCloud: topic('VITE_ROS_POINTCLOUD_TOPIC', '/points'),
  inflatedMap: topic('VITE_ROS_INFLATED_MAP_TOPIC', '/inflated_map'),
  odom: topic('VITE_ROS_ODOM_TOPIC', '/odom'),
  pose: topic('VITE_ROS_POSE_TOPIC', '/pose'),
  expectedControl: topic('VITE_ROS_EXPECTED_CONTROL_TOPIC', '/goal_pose'),
  initialPose: topic('VITE_ROS_INITIAL_POSE_TOPIC', '/initialpose'),
  goalMarker: topic('VITE_ROS_GOAL_MARKER_TOPIC', '/visualization/goal'),
  expSfc: topic('VITE_ROS_EXP_SFC_TOPIC', '/visualization/exp_sfc'),
  path: topic('VITE_ROS_PATH_TOPIC', '/fsm/path'),
  expTraj: topic('VITE_ROS_EXP_TRAJ_TOPIC', '/visualization/exp_traj'),
  backupTraj: topic('VITE_ROS_BACKUP_TRAJ_TOPIC', '/visualization/backup_traj'),
  cmdVel: topic('VITE_ROS_CMD_VEL_TOPIC', '/cmd_vel')
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
  { topic: ROS_TOPICS.odom, type: 'nav_msgs/msg/Odometry' },
  { topic: ROS_TOPICS.pose, type: 'geometry_msgs/msg/PoseStamped' }
].filter((item, index, items) => item.topic && items.findIndex(other => other.topic === item.topic) === index)
