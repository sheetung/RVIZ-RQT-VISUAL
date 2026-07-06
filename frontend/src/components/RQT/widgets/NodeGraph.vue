<template>
  <div class="node-graph">
    <!-- 控制栏 -->
    <div class="graph-controls">
      <el-button-group size="small">
        <el-button @click="refreshGraph" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="resetLayout">
          <el-icon><Aim /></el-icon>
          重置布局
        </el-button>
        <el-button @click="exportGraph">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </el-button-group>
      
      <el-switch
        v-model="showTopics"
        active-text="显示主题"
        @change="updateGraphDisplay"
      />
    </div>
    
    <!-- 图形容器 -->
    <div ref="graphContainer" class="graph-container">
      <svg 
        ref="svgElement" 
        class="node-graph-svg"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
      >
        <!-- 定义箭头标记 -->
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#999"
            />
          </marker>
        </defs>
        
        <!-- 连接线 -->
        <g class="links">
          <line
            v-for="link in links"
            :key="link.id"
            :x1="link.source.x"
            :y1="link.source.y"
            :x2="link.target.x"
            :y2="link.target.y"
            :stroke="link.color"
            stroke-width="2"
            marker-end="url(#arrowhead)"
            @click="onLinkClick(link)"
          />
        </g>
        
        <!-- 节点 -->
        <g class="nodes">
          <g
            v-for="node in nodes"
            :key="node.id"
            :transform="`translate(${node.x}, ${node.y})`"
            class="node"
            @click="onNodeClick(node)"
            @mousedown="startDrag(node, $event)"
          >
            <!-- 节点圆圈 -->
            <circle
              :r="node.radius"
              :fill="node.color"
              :stroke="node.selected ? '#409eff' : '#fff'"
              :stroke-width="node.selected ? 3 : 2"
              class="node-circle"
            />
            
            <!-- 节点图标 -->
            <text
              :font-size="node.radius * 0.8"
              text-anchor="middle"
              dy="0.35em"
              fill="white"
              class="node-icon"
            >
              {{ node.icon }}
            </text>
            
            <!-- 节点标签 -->
            <text
              :y="node.radius + 15"
              text-anchor="middle"
              font-size="12"
              fill="#333"
              class="node-label"
            >
              {{ node.name }}
            </text>
          </g>
        </g>
      </svg>
      
      <!-- 图例 -->
      <div class="graph-legend">
        <div class="legend-item">
          <div class="legend-color" style="background-color: #67C23A;"></div>
          <span>ROS节点</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #409EFF;"></div>
          <span>主题</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #E6A23C;"></div>
          <span>服务</span>
        </div>
      </div>
    </div>
    
    <!-- 节点详情面板 -->
    <el-drawer
      v-model="showNodeDetail"
      :title="selectedNode?.name"
      direction="rtl"
      size="400px"
    >
      <div v-if="selectedNode" class="node-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="节点名称">
            {{ selectedNode.name }}
          </el-descriptions-item>
          <el-descriptions-item label="命名空间">
            {{ selectedNode.namespace || '/' }}
          </el-descriptions-item>
          <el-descriptions-item label="节点类型">
            {{ selectedNode.type }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedNode.active ? 'success' : 'danger'">
              {{ selectedNode.active ? '运行中' : '停止' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <el-divider>发布的主题</el-divider>
        <div class="topic-list">
          <el-tag
            v-for="topic in selectedNode.publishedTopics"
            :key="topic"
            size="small"
            type="success"
            class="topic-tag"
          >
            {{ topic }}
          </el-tag>
          <el-text v-if="!selectedNode.publishedTopics?.length" type="info">
            无发布主题
          </el-text>
        </div>
        
        <el-divider>订阅的主题</el-divider>
        <div class="topic-list">
          <el-tag
            v-for="topic in selectedNode.subscribedTopics"
            :key="topic"
            size="small"
            type="warning"
            class="topic-tag"
          >
            {{ topic }}
          </el-tag>
          <el-text v-if="!selectedNode.subscribedTopics?.length" type="info">
            无订阅主题
          </el-text>
        </div>
        
        <el-divider>提供的服务</el-divider>
        <div class="service-list">
          <el-tag
            v-for="service in selectedNode.services"
            :key="service"
            size="small"
            type="info"
            class="service-tag"
          >
            {{ service }}
          </el-tag>
          <el-text v-if="!selectedNode.services?.length" type="info">
            无提供服务
          </el-text>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Refresh, Aim, Download } from '@element-plus/icons-vue'

export default {
  name: 'NodeGraph',
  components: {
    Refresh,
    Aim,
    Download
  },
  setup() {
    const graphContainer = ref(null)
    const svgElement = ref(null)
    const loading = ref(false)
    const showTopics = ref(true)
    const showNodeDetail = ref(false)
    const selectedNode = ref(null)
    
    // 拖拽状态
    const dragState = reactive({
      isDragging: false,
      dragNode: null,
      startX: 0,
      startY: 0
    })
    
    // 节点和连接数据
    const nodes = ref([])
    const links = ref([])
    
    // 初始化图数据
    const initializeGraph = () => {
      // 模拟节点数据
      nodes.value = [
        {
          id: 'robot_controller',
          name: 'robot_controller',
          namespace: '/',
          type: 'ROS节点',
          x: 150,
          y: 100,
          radius: 25,
          color: '#67C23A',
          icon: '🤖',
          active: true,
          selected: false,
          publishedTopics: [ROS_TOPICS.cmdVel, ROS_TOPICS.odom].filter(Boolean),
          subscribedTopics: [ROS_TOPICS.laserScan].filter(Boolean),
          services: ['/start_navigation', '/stop_robot']
        },
        {
          id: 'laser_node',
          name: 'laser_node',
          namespace: '/',
          type: 'ROS节点',
          x: 50,
          y: 200,
          radius: 20,
          color: '#67C23A',
          icon: '📡',
          active: true,
          selected: false,
          publishedTopics: [ROS_TOPICS.laserScan].filter(Boolean),
          subscribedTopics: [],
          services: ['/laser_config']
        },
        {
          id: 'camera_node',
          name: 'camera_node',
          namespace: '/',
          type: 'ROS节点',
          x: 250,
          y: 200,
          radius: 20,
          color: '#67C23A',
          icon: '📷',
          active: true,
          selected: false,
          publishedTopics: [],
          subscribedTopics: [],
          services: []
        },
        {
          id: 'navigation',
          name: 'navigation',
          namespace: '/',
          type: 'ROS节点',
          x: 150,
          y: 300,
          radius: 25,
          color: '#67C23A',
          icon: '🗺️',
          active: true,
          selected: false,
          publishedTopics: [ROS_TOPICS.path].filter(Boolean),
          subscribedTopics: [ROS_TOPICS.laserScan, ROS_TOPICS.odom, ROS_TOPICS.expectedControl].filter(Boolean),
          services: ['/make_plan', '/clear_costmaps']
        }
      ]
      
      // 如果显示主题，添加主题节点
      if (showTopics.value) {
        const topicNodes = [
          {
            id: 'scan_topic',
            name: ROS_TOPICS.laserScan,
            type: '主题',
            x: 100,
            y: 150,
            radius: 15,
            color: '#409EFF',
            icon: '📊',
            active: true,
            selected: false
          },
          {
            id: 'cmd_vel_topic',
            name: ROS_TOPICS.cmdVel,
            type: '主题',
            x: 200,
            y: 150,
            radius: 15,
            color: '#409EFF',
            icon: '📊',
            active: true,
            selected: false
          }
        ]
        nodes.value.push(...topicNodes)
      }
      
      // 生成连接
      generateLinks()
    }
    
    // 生成连接线
    const generateLinks = () => {
      links.value = []
      let linkId = 0
      
      // 节点到主题的连接
      nodes.value.forEach(node => {
        if (node.type === 'ROS节点') {
          // 发布连接
          node.publishedTopics?.forEach(topicName => {
            const topicNode = nodes.value.find(n => n.name === topicName && n.type === '主题')
            if (topicNode) {
              links.value.push({
                id: `link_${linkId++}`,
                source: node,
                target: topicNode,
                color: '#67C23A',
                type: 'publish'
              })
            }
          })
          
          // 订阅连接
          node.subscribedTopics?.forEach(topicName => {
            const topicNode = nodes.value.find(n => n.name === topicName && n.type === '主题')
            if (topicNode) {
              links.value.push({
                id: `link_${linkId++}`,
                source: topicNode,
                target: node,
                color: '#409EFF',
                type: 'subscribe'
              })
            }
          })
        }
      })
    }
    
    // 刷新图形
    const refreshGraph = async () => {
      loading.value = true
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        initializeGraph()
        ElMessage.success('节点图已刷新')
      } catch (error) {
        ElMessage.error('刷新失败')
      } finally {
        loading.value = false
      }
    }
    
    // 重置布局
    const resetLayout = () => {
      // 重新计算节点位置
      const centerX = graphContainer.value.clientWidth / 2
      const centerY = graphContainer.value.clientHeight / 2
      const radius = 100
      
      nodes.value.forEach((node, index) => {
        if (node.type === 'ROS节点') {
          const angle = (index * 2 * Math.PI) / nodes.value.filter(n => n.type === 'ROS节点').length
          node.x = centerX + radius * Math.cos(angle)
          node.y = centerY + radius * Math.sin(angle)
        }
      })
      
      generateLinks()
    }
    
    // 导出图形
    const exportGraph = () => {
      const graphData = {
        nodes: nodes.value.map(node => ({
          id: node.id,
          name: node.name,
          type: node.type,
          active: node.active
        })),
        links: links.value.map(link => ({
          source: link.source.id,
          target: link.target.id,
          type: link.type
        }))
      }
      
      const blob = new Blob([JSON.stringify(graphData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `node-graph-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      ElMessage.success('节点图已导出')
    }
    
    // 更新图形显示
    const updateGraphDisplay = () => {
      initializeGraph()
    }
    
    // 节点点击事件
    const onNodeClick = (node) => {
      // 清除其他节点的选中状态
      nodes.value.forEach(n => n.selected = false)
      
      // 选中当前节点
      node.selected = true
      
      if (node.type === 'ROS节点') {
        selectedNode.value = node
        showNodeDetail.value = true
      }
    }
    
    // 连接点击事件
    const onLinkClick = (link) => {
      console.log('Link clicked:', link)
    }
    
    // 开始拖拽
    const startDrag = (node, event) => {
      dragState.isDragging = true
      dragState.dragNode = node
      dragState.startX = event.clientX - node.x
      dragState.startY = event.clientY - node.y
      
      event.preventDefault()
    }
    
    // 鼠标移动
    const onMouseMove = (event) => {
      if (dragState.isDragging && dragState.dragNode) {
        dragState.dragNode.x = event.clientX - dragState.startX
        dragState.dragNode.y = event.clientY - dragState.startY
        
        // 更新相关连接
        generateLinks()
      }
    }
    
    // 结束拖拽
    const onMouseUp = () => {
      dragState.isDragging = false
      dragState.dragNode = null
    }
    
    // 鼠标按下事件
    const onMouseDown = (event) => {
      // 空白区域点击，清除选择
      if (event.target === svgElement.value) {
        nodes.value.forEach(n => n.selected = false)
        showNodeDetail.value = false
      }
    }
    
    // 获取节点数据（供父组件调用）
    const getNodeData = () => {
      return nodes.value.filter(n => n.type === 'ROS节点').map(node => ({
        name: node.name,
        namespace: node.namespace,
        active: node.active,
        publishedTopics: node.publishedTopics?.length || 0,
        subscribedTopics: node.subscribedTopics?.length || 0,
        services: node.services?.length || 0
      }))
    }
    
    onMounted(async () => {
      await nextTick()
      initializeGraph()
    })
    
    return {
      graphContainer,
      svgElement,
      loading,
      showTopics,
      showNodeDetail,
      selectedNode,
      nodes,
      links,
      refreshGraph,
      resetLayout,
      exportGraph,
      updateGraphDisplay,
      onNodeClick,
      onLinkClick,
      // 暴露方法供父组件调用 (refresh别名为refreshGraph)
      getNodeData,
      startDrag,
      onMouseMove,
      onMouseUp,
      onMouseDown
    }
  }
}
</script>

<style scoped>
.node-graph {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.graph-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 0 5px;
}

.graph-container {
  flex: 1;
  position: relative;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  overflow: hidden;
}

.node-graph-svg {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.node-graph-svg:active {
  cursor: grabbing;
}

.node {
  cursor: pointer;
  transition: opacity 0.3s;
}

.node:hover {
  opacity: 0.8;
}

.node-circle {
  transition: all 0.3s;
}

.node-icon {
  pointer-events: none;
}

.node-label {
  pointer-events: none;
  font-weight: 500;
}

.links line {
  cursor: pointer;
  transition: stroke-width 0.3s;
}

.links line:hover {
  stroke-width: 3;
}

.graph-legend {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e6e6e6;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  font-size: 12px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 8px;
}

.node-detail {
  padding: 20px;
}

.topic-list,
.service-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
}

.topic-tag,
.service-tag {
  margin: 2px;
}
</style>
